#!/usr/bin/env node
/**
 * Catalog linter for girth-agents.
 *
 * Enforces this repo's publishing rules for .opencode/{agents,skills,commands}
 * (see AGENTS.md and docs/CONTRIBUTING.md). Zero dependencies, Node 18+.
 *
 *   node scripts/validate.mjs [--root <path>]
 *
 * Exit code: 0 clean, 1 errors found, 2 usage. Warnings do not fail.
 */
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCRIPT = fileURLToPath(import.meta.url)
let root = path.resolve(path.dirname(SCRIPT), "..")
const argv = process.argv.slice(2)
if (argv.length === 2 && argv[0] === "--root") root = path.resolve(argv[1])
else if (argv.length > 0) {
  console.error(`usage: node ${path.basename(SCRIPT)} [--root <path>]`)
  process.exit(2)
}

const errors = []
const warnings = []
const notes = []

const err = (where, msg) => errors.push(`${where}: ${msg}`)
const warn = (where, msg) => warnings.push(`${where}: ${msg}`)
const note = (msg) => notes.push(msg)

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const AGENT_MODES = new Set(["primary", "subagent", "all"])
/** OpenCode V2 rejects these V1-era top-level agent fields. */
const LEGACY_AGENT_FIELDS = [
  "temperature",
  "top_p",
  "prompt",
  "permission",
  "tools",
  "disable",
  "maxSteps",
]

/** Split "---\n...frontmatter...\n---\nbody" into { fm, body }; fm is null when absent. */
function splitFrontmatter(text) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n([\s\S]*))?$/.exec(text)
  if (!m) return { fm: null, body: text }
  return { fm: m[1], body: m[2] ?? "" }
}

/** Top-level frontmatter keys (indented lines are nested keys or list items). */
function topLevelKeys(fm) {
  const keys = new Set()
  for (const line of fm.split(/\r?\n/)) {
    const m = /^([A-Za-z_][\w-]*)[ \t]*:/.exec(line)
    if (m) keys.add(m[1])
  }
  return keys
}

/** Trimmed value of a scalar frontmatter key, or undefined when absent/empty. */
function scalar(fm, key) {
  const m = new RegExp(`^${key}[ \\t]*:[ \\t]*(.*[^ \\t])?[ \\t]*$`, "m").exec(fm)
  return m ? m[1] : undefined
}

/** Directory entries excluding dotfiles; a missing directory reads as empty. */
async function entries(dir) {
  try {
    return (await readdir(dir, { withFileTypes: true })).filter((e) => !e.name.startsWith("."))
  } catch {
    return []
  }
}

async function exists(p) {
  return stat(p).then(() => true, () => false)
}

/**
 * Paths a SKILL.md refers to (inline code or Markdown links) that start with
 * references/, scripts/, or assets/ and should resolve next to SKILL.md.
 */
function referencedPaths(body) {
  const re = /`((?:references|scripts|assets)\/[^\s`]+)`|\(((?:\.\/)?(?:references|scripts|assets)\/[^)\s#]+)\)/g
  const out = new Set()
  let m
  while ((m = re.exec(body))) {
    const p = (m[1] || m[2]).replace(/^\.\//, "")
    if (p && !p.endsWith("/")) out.add(p)
  }
  return out
}

async function checkAgents() {
  const dir = path.join(root, ".opencode", "agents")
  const list = await entries(dir)
  if (!list.length && !(await exists(dir))) note("no .opencode/agents directory yet")
  let ok = 0
  for (const e of list) {
    const rel = path.posix.join("agents", e.name)
    if (e.isDirectory()) {
      err(rel, "agents must be flat .md files (no nested directories); a nested path would become part of the agent ID")
      continue
    }
    if (!e.isFile() || !e.name.endsWith(".md")) {
      err(rel, "only .md files belong in agents/")
      continue
    }
    const id = e.name.slice(0, -3)
    if (!KEBAB.test(id)) err(rel, `agent ID "${id}" must be lowercase kebab-case (a-z, 0-9, single dashes)`)
    const { fm, body } = splitFrontmatter(await readFile(path.join(dir, e.name), "utf8"))
    if (!fm) {
      err(rel, "missing YAML frontmatter (--- ... --- block)")
      continue
    }
    if (!scalar(fm, "description")) err(rel, "frontmatter must include a non-empty description")
    const mode = scalar(fm, "mode")
    if (mode && !AGENT_MODES.has(mode)) err(rel, `mode must be primary, subagent, or all (got "${mode}")`)
    const keys = topLevelKeys(fm)
    for (const legacy of LEGACY_AGENT_FIELDS) {
      if (keys.has(legacy)) err(rel, `frontmatter uses the OpenCode V1 field "${legacy}"; V2 ignores it — remove it`)
    }
    if (!body.trim()) warn(rel, "no system prompt after the frontmatter block")
    ok++
  }
  return ok
}

async function checkSkills() {
  const dir = path.join(root, ".opencode", "skills")
  const list = await entries(dir)
  if (!list.length && !(await exists(dir))) note("no .opencode/skills directory yet")
  let ok = 0
  for (const e of list) {
    const rel = path.posix.join("skills", e.name)
    if (e.isFile()) {
      err(rel, "skills must use the directory form .opencode/skills/<id>/SKILL.md where the directory name is the skill ID")
      continue
    }
    if (!e.isDirectory()) continue
    const id = e.name
    const sdir = path.join(dir, id)
    if (!KEBAB.test(id)) err(rel, `skill ID "${id}" must be lowercase kebab-case (a-z, 0-9, single dashes)`)
    let text
    try {
      text = await readFile(path.join(sdir, "SKILL.md"), "utf8")
    } catch {
      err(rel, "missing SKILL.md")
      continue
    }
    const { fm, body } = splitFrontmatter(text)
    if (!fm) {
      err(rel, "missing YAML frontmatter (--- ... --- block)")
    } else {
      if (!scalar(fm, "name")) warn(rel, "frontmatter should include a name (display label)")
      if (!scalar(fm, "description")) err(rel, "frontmatter must include a non-empty description, or OpenCode will never advertise this skill")
    }
    for (const p of referencedPaths(body)) {
      if (!(await exists(path.join(sdir, p)))) warn(rel, `references "${p}" but no such file exists next to SKILL.md`)
    }
    ok++
  }
  return ok
}

async function checkCommands() {
  const dir = path.join(root, ".opencode", "commands")
  const list = await entries(dir)
  if (!list.length && !(await exists(dir))) note("no .opencode/commands directory yet")
  let ok = 0
  for (const e of list) {
    const rel = path.posix.join("commands", e.name)
    if (e.isDirectory()) {
      err(rel, "commands must be flat .md files (no nested directories)")
      continue
    }
    if (!e.isFile() || !e.name.endsWith(".md")) {
      err(rel, "only .md files belong in commands/")
      continue
    }
    const id = e.name.slice(0, -3)
    if (!KEBAB.test(id)) err(rel, `command name "${id}" must be lowercase kebab-case (a-z, 0-9, single dashes)`)
    const { fm, body } = splitFrontmatter(await readFile(path.join(dir, e.name), "utf8"))
    if (!body.trim()) err(rel, "command body is empty — the Markdown body is the prompt template")
    if (fm) {
      if (topLevelKeys(fm).has("template")) err(rel, "do not put template in frontmatter; the Markdown body supplies it")
      if (!scalar(fm, "description")) warn(rel, "frontmatter should include a description (shown in command lists)")
    }
    ok++
  }
  return ok
}

console.log("girth-agents catalog lint")
console.log(`root: ${root}\n`)

const agents = await checkAgents()
const skills = await checkSkills()
const commands = await checkCommands()

console.log(`scanned: ${agents} agent(s), ${skills} skill(s), ${commands} command(s)`)

if (errors.length) console.error(`\n${errors.join("\n")}`)
if (warnings.length) console.warn(`\n${warnings.join("\n")}`)
if (notes.length) console.log(`\n${notes.join("\n")}`)

const summary = `${errors.length} error(s), ${warnings.length} warning(s)`
if (errors.length) {
  console.error(`\n${summary}`)
  process.exit(1)
}
console.log(`\n${summary} — all checks passed.`)