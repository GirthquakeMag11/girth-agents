import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin"

const here = dirname(fileURLToPath(import.meta.url))
const catalog = join(here, "..", ".opencode")

function frontmatter(text: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text)
  if (!match) return { data: {}, body: text }
  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line)
    if (pair) data[pair[1]] = pair[2].trim()
  }
  return { data, body: match[2].trim() }
}

function listDirs(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
}

async function runKeystoneProbe(ctx: any): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  try {
    const probeKey = `girth.keystone.${Date.now()}`
    await ctx.storage.set(probeKey, { t: Date.now() })
    const readBack = await ctx.storage.get(probeKey)
    out["ctx.storage roundtrip"] = readBack ? "writes persist and read back" : "SET-READ-MISMATCH"
    out["ctx.storage durability"] = "persists across restarts: NOT YET VERIFIED (requires a second load; recorded honestly below)"
  } catch (error: any) {
    out["ctx.storage roundtrip"] = `FAILED: ${error?.message ?? error}`
  }
  try {
    const types: string[] = []
    const controller = new AbortController()
    const sub = (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        types.push(typeof event === "string" ? "(string payload)" : (event as any)?.type ?? "(no type field)")
        if (types.length >= 3) break
      }
    })()
    await Promise.race([sub, new Promise((r) => setTimeout(r, 2500))])
    controller.abort()
    const idle = types.some((t) => String(t).includes("idle"))
    out["event catalog"] = { firstSeen: types.slice(0, 3), sessionIdleSeen: idle }
  } catch (error: any) {
    out["event catalog"] = `FAILED: ${error?.message ?? error}`
  }
  return out
}

export default Plugin.define({
  id: "girth-agents",
  async setup(ctx: any) {
    console.log("[girth-agents] setup begins")
    const registered = { skills: 0, commands: 0, agents: 0 }

    // Skills: bundled markdown is the source of truth.
    const skillsRoot = join(catalog, "skills")
    for (const id of listDirs(skillsRoot)) {
      const skillPath = join(skillsRoot, id, "SKILL.md")
      if (!existsSync(skillPath)) continue
      const content = readFileSync(skillPath, "utf8")
      const { data } = frontmatter(content)
      const registration: any = {
        id,
        name: data.name ?? id,
        description: data.description ?? id,
        path: skillPath,
        content,
        autoinvoke: false,
      }
      try {
        await ctx.skill.transform((editor: any) => {
          editor.add(registration)
        })
        registered.skills += 1
      } catch {
        // counted only on success
      }
    }

    // Commands: one thin door per markdown file, its body the prompt template.
    const commandsRoot = join(catalog, "commands")
    for (const file of listFiles(commandsRoot)) {
      const commandPath = join(commandsRoot, file)
      const { data, body } = frontmatter(readFileSync(commandPath, "utf8"))
      const name = file.replace(/\.md$/, "")
      try {
        await ctx.command.transform((editor: any) => {
          editor.add({
            name,
            description: data.description ?? name,
            execute: async ({ sessionID, prompt, delivery }: any) => {
              await ctx.session.prompt({
                ...(prompt ?? {}),
                sessionID,
                text: body,
                delivery: delivery ?? "steer",
              })
            },
          })
        })
        registered.commands += 1
      } catch {
        // counted only on success
      }
    }

    // Agents: detect the channel honestly — never throw inside a transform,
    // which disables the whole plugin.
    const agentsRoot = join(catalog, "agents")
    const agentFiles = listFiles(agentsRoot)
    let agentAddSupported: boolean | null = null
    for (const file of agentFiles) {
      const { data } = frontmatter(readFileSync(join(agentsRoot, file), "utf8"))
      const agentID = file.replace(/\.md$/, "")
      await ctx.agent.transform((editor: any) => {
        if (typeof editor.add === "function") {
          editor.add({ id: agentID, description: data.description ?? agentID })
          agentAddSupported = true
          registered.agents += 1
        } else {
          agentAddSupported = false
        }
      })
    }
    await ctx.storage.set("girth.keystone.agent-add", {
      outcome:
        agentAddSupported === false
          ? "NOT SUPPORTED — AgentEditor has no add"
          : agentFiles.length > 0
            ? "SUPPORTED"
            : "NO AGENTS YET — the catalog has no agent files",
      at: new Date().toISOString(),
    })

    // Durability probe: a fixed marker, written once, read back after a restart.
    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "durability",
        description: "Write or read the durability marker across service restarts.",
        input: {
          type: "object",
          properties: { mode: { type: "string", enum: ["write", "read"] } },
          required: ["mode"],
          additionalProperties: false,
        },
        options: { namespace: "girth", codemode: true },
        execute: async (input: any) => {
          const key = "girth.durability.marker"
          if (input.mode === "write") {
            const mark = new Date().toISOString()
            await ctx.storage.set(key, mark)
            return { content: JSON.stringify({ wrote: mark }) }
          }
          const read = await ctx.storage.get(key)
          return { content: JSON.stringify({ read: read ?? null }) }
        },
      })
    })

    // Keystone probe tool: the honest record of what the platform allows.
    await ctx.tool.transform((editor: any) => {
      editor.namespace({ name: "girth", description: "girth-agents maintenance tools" })
      editor.add({
        name: "keystones",
        description: "Probe and report the plugin's build-time keystones (storage, events, codemode).",
        input: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        options: { namespace: "girth", codemode: true },
        execute: async (_input: any, context: any) => {
          const probe = await runKeystoneProbe(ctx)
          return {
            content: JSON.stringify(
              {
                registered,
                probe,
                codemode: "this tool itself carries codemode:true — its presence here is the probe",
                noted: "Outcomes are transcribed into the repo's keystone record by the maintainer.",
              },
              null,
              2,
            ),
          }
        },
      })
    })

    return () => {}
  },
})