// A strict frontmatter parser for the constrained subset this project
// needs: scalars, inline arrays, nested maps, and array items that are
// maps with continuation keys — nothing else. Anything outside the
// subset is a typed, line-naming SyntaxError, so a malformed file
// fails loudly at load, never half-parses.

const KEY_PAIR = /^([A-Za-z_][A-Za-z0-9_-]*):(.*)$/;
const INT = /^-?\d+$/;
const FLOAT = /^-?\d+\.\d+$/;

function fail(entry, message) {
  throw new SyntaxError(`frontmatter line ${entry.line}: ${message}`);
}

function scalar(text, entry) {
  const raw = text.trim();
  if (raw === "") return fail(entry, "empty value with no nested content");
  if (raw.startsWith("{")) return fail(entry, "flow maps are unsupported — use nested indentation");
  if (raw.startsWith("|") || raw.startsWith(">")) return fail(entry, "block scalars are unsupported");
  if (/^[!&*]/.test(raw)) return fail(entry, "tags, anchors, and aliases are unsupported");
  if (raw.startsWith("[")) {
    if (!raw.endsWith("]")) return fail(entry, "unclosed inline array");
    const inner = raw.slice(1, -1).trim();
    if (inner === "") return [];
    return inner.split(",").map((item) => {
      const s = item.trim();
      if (s.startsWith("[") || s.startsWith("{")) return fail(entry, "nested inline structures are unsupported");
      if (s.startsWith('"')) {
        const m = s.match(/^"((?:[^"\\]|\\.)*)"$/);
        if (!m) return fail(entry, `unclosed quote in array item ${s}`);
        return m[1].replace(/\\(.)/g, "$1");
      }
      return unquoted(s, entry);
    });
  }
  if (raw.startsWith('"')) {
    const m = raw.match(/^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/);
    if (!m) return fail(entry, `unclosed quote in ${raw}`);
    return m[1].replace(/\\(.)/g, "$1");
  }
  return unquoted(raw, entry);
}

function unquoted(raw, entry) {
  // a ' #' begins a comment only when preceded by whitespace
  const idx = raw.search(/\s+#/);
  const s = (idx === -1 ? raw : raw.slice(0, idx)).trim();
  if (s === "true" || s === "false") return s === "true";
  if (INT.test(s)) return parseInt(s, 10);
  if (FLOAT.test(s)) return parseFloat(s);
  return s;
}

export function parseFrontmatter(text) {
  const lines = text.split("\n");
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") start++;
  if (lines[start]?.trim() !== "---") {
    throw new SyntaxError("frontmatter: expected an opening --- fence");
  }
  let end = -1;
  for (let j = start + 1; j < lines.length; j++) {
    if (lines[j].trim() === "---") {
      end = j;
      break;
    }
  }
  if (end === -1) throw new SyntaxError("frontmatter: unclosed --- fence");

  const entries = [];
  for (let j = start + 1; j < end; j++) {
    const raw = lines[j];
    if (raw.includes("\t")) throw new SyntaxError(`frontmatter line ${j + 1}: tabs are not allowed`);
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    entries.push({ line: j + 1, indent: raw.match(/^ */)[0].length, text: trimmed });
  }

  const { value, next } = parseBlock(entries, 0, 0);
  if (next !== entries.length) {
    fail(entries[next], "unexpected content after the root map");
  }
  return { data: value, body: lines.slice(end + 1).join("\n") };
}

// Parse a block of same-indent entries; the block is a map unless its
// first entry is an array item.
function parseBlock(entries, i, indent) {
  if (i < entries.length && entries[i].text.startsWith("- ")) {
    return parseArray(entries, i, indent);
  }
  return parseMap(entries, i, indent);
}

function parseMap(entries, i, indent) {
  const out = {};
  while (i < entries.length) {
    const entry = entries[i];
    if (entry.indent < indent) break;
    if (entry.indent > indent) return fail(entry, "inconsistent indentation");
    const m = entry.text.match(KEY_PAIR);
    if (!m) return fail(entry, `expected a 'key: value' pair, got '${entry.text}'`);
    i += 1;
    if (m[2].trim() === "") {
      if (i < entries.length && entries[i].indent > indent) {
        const child = parseBlock(entries, i, entries[i].indent);
        out[m[1]] = child.value;
        i = child.next;
      } else {
        fail(entry, `'${m[1]}' has no value`);
      }
    } else {
      out[m[1]] = scalar(m[2], entry);
    }
  }
  return { value: out, next: i };
}

function parseArray(entries, i, indent) {
  const out = [];
  while (i < entries.length) {
    const entry = entries[i];
    if (entry.indent < indent) break;
    if (entry.indent > indent) return fail(entry, "inconsistent indentation");
    if (!entry.text.startsWith("- ")) return fail(entry, `expected an array item, got '${entry.text}'`);
    const rest = entry.text.slice(2).trim();
    i += 1;

    const pair = rest.match(KEY_PAIR);
    if (pair) {
      // a map item: '- key: value' or '- key:' plus deeper continuation keys
      const itemMap = {};
      const addPair = (key, text, at) => {
        if (text.trim() === "") {
          if (i < entries.length && entries[i].indent > at.indent) {
            const child = parseBlock(entries, i, entries[i].indent);
            itemMap[key] = child.value;
            i = child.next;
          } else {
            fail(at, `'${key}' has no value`);
          }
        } else {
          itemMap[key] = scalar(text, at);
        }
      };
      addPair(pair[1], pair[2], entry);
      let continuationIndent = null;
      while (i < entries.length && entries[i].indent > indent) {
        const cont = entries[i];
        const cm = cont.text.match(KEY_PAIR);
        if (!cm) return fail(cont, "expected a map key continuing the array item");
        if (continuationIndent === null) continuationIndent = cont.indent;
        if (cont.indent !== continuationIndent) return fail(cont, "inconsistent indentation");
        i += 1;
        addPair(cm[1], cm[2], cont);
      }
      out.push(itemMap);
      continue;
    }

    if (rest === "") {
      if (i < entries.length && entries[i].indent > indent) {
        const child = parseBlock(entries, i, entries[i].indent);
        out.push(child.value);
        i = child.next;
      } else {
        fail(entry, "array item has no value");
      }
      continue;
    }

    out.push(scalar(rest, entry));
  }
  return { value: out, next: i };
}