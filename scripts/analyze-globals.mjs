#!/usr/bin/env node
/**
 * One-off migration aid for the esbuild move (A1): analyses the 55 client
 * modules that today share one concatenated scope and reports, per file,
 *  - which names it must IMPORT (declared at top level in another module)
 *  - which names it must EXPORT (used by another module)
 *  - ambiguous names (locally shadowed anywhere in the file) for manual review
 * With --write it applies the changes in-place: prepends single-line named
 * imports and adds `export ` to top-level declarations that need it.
 * Idempotent: files already carrying the import/export are skipped.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CLIENT_BUNDLE_FILES } from './bundle-client.mjs'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CLIENT_DIR = path.join(ROOT, 'src/client')
const FILES = [...CLIENT_BUNDLE_FILES.filter((f) => f !== 'main.js'), 'styles.js', 'main.js']
const WRITE = process.argv.includes('--write')

// Replace comments and string contents with spaces (keeping newlines) while
// preserving ${...} expressions inside template literals.
function mask(src) {
  let out = ''
  let i = 0
  const n = src.length
  const blank = (s) => s.replace(/[^\n]/g, ' ')
  while (i < n) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i)
      if (j < 0) j = n
      out += blank(src.slice(i, j)); i = j
    } else if (c === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2)
      j = j < 0 ? n : j + 2
      out += blank(src.slice(i, j)); i = j
    } else if (c === "'" || c === '"') {
      let j = i + 1
      while (j < n && src[j] !== c) j += src[j] === '\\' ? 2 : 1
      j = Math.min(j + 1, n)
      out += blank(src.slice(i, j)); i = j
    } else if (c === '`') {
      out += ' '; i++
      while (i < n && src[i] !== '`') {
        if (src[i] === '\\') { out += '  '; i += 2 }
        else if (src[i] === '$' && src[i + 1] === '{') {
          let depth = 1
          let j = i + 2
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++
            else if (src[j] === '}') depth--
            j++
          }
          out += '  ' + mask(src.slice(i + 2, j - 1)) + ' '
          i = j
        } else { out += src[i] === '\n' ? '\n' : ' '; i++ }
      }
      out += ' '; i++ // closing backtick
    } else { out += c; i++ }
  }
  return out
}

const read = (f) => fs.readFileSync(path.join(CLIENT_DIR, f), 'utf8')

// --- pass 1: top-level declarations per file --------------------------------
const decls = new Map() // file -> Map(name -> {kind, exported})
const declOwner = new Map() // name -> file
for (const f of FILES) {
  const src = read(f)
  const m = new Map()
  const re = /^(export\s+)?(async\s+function|function|const|let|var|class)\s+([A-Za-z_$][\w$]*)|^(export\s+)?(const|let|var)\s*\{([^}]*)\}/gm
  let mm
  while ((mm = re.exec(src))) {
    if (mm[3]) {
      m.set(mm[3], { kind: mm[2], exported: !!mm[1] })
    } else if (mm[6]) {
      for (const part of mm[6].split(',')) {
        const name = part.trim().split(/[:\s]/)[0].trim()
        if (/^[A-Za-z_$][\w$]*$/.test(name)) m.set(name, { kind: mm[5], exported: !!mm[4] })
      }
    }
  }
  decls.set(f, m)
  for (const name of m.keys()) {
    if (declOwner.has(name)) console.error(`DUPLICATE top-level name "${name}": ${declOwner.get(name)} and ${f}`)
    declOwner.set(name, f)
  }
}

// --- pass 2: cross-module usages --------------------------------------------
const needs = new Map() // file -> Map(name -> ownerFile)
const ambiguous = new Map() // file -> Set(name)
for (const f of FILES) {
  const src = mask(read(f))
  const own = decls.get(f)
  // any-depth local declarations (shadow candidates)
  const locals = new Set()
  for (const re of [
    /(?:^|[({,;\s])(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g,
    /function\s*[A-Za-z_$]*\s*\(([^)]*)\)/g,
    /\(([^()]*)\)\s*=>/g,
    /^\s*([A-Za-z_$][\w$]*)\s*=>/gm,
    /\(([A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)*)\)\s*=>/g,
  ]) {
    let mm
    while ((mm = re.exec(src))) {
      for (const p of mm[1].split(',')) {
        const name = p.trim().split(/[=:\s]/)[0].trim()
        if (/^[A-Za-z_$][\w$]*$/.test(name)) locals.add(name)
      }
    }
  }
  const found = new Map()
  const idRe = /[A-Za-z_$][\w$]*/g
  let mm
  while ((mm = idRe.exec(src))) {
    const name = mm[0]
    if (own.has(name) || !declOwner.has(name)) continue
    const before = src[mm.index - 1]
    if (before === '.') continue // property access
    const after = src.slice(mm.index + name.length).match(/^\s*([:?])/)
    if (after && after[1] === ':') continue // object key / label
    found.set(name, declOwner.get(name))
  }
  const real = new Map()
  const amb = new Set()
  for (const [name, owner] of found) {
    if (locals.has(name)) amb.add(name)
    else real.set(name, owner)
  }
  needs.set(f, real)
  if (amb.size) ambiguous.set(f, amb)
}

// --- report ------------------------------------------------------------------
const usedBy = new Map() // file -> Map(name -> Set(consumer))
for (const [f, im] of needs) {
  for (const [name, owner] of im) {
    if (!usedBy.has(owner)) usedBy.set(owner, new Map())
    const m = usedBy.get(owner)
    if (!m.has(name)) m.set(name, new Set())
    m.get(name).add(f)
  }
}

const rel = (from, to) => {
  let r = path.relative(path.dirname(from), to).replace(/\\/g, '/')
  if (!r.startsWith('.')) r = './' + r
  return r
}

let totalImports = 0
let totalExports = 0
for (const f of FILES) {
  const im = needs.get(f)
  const ex = usedBy.get(f)
  const amb = ambiguous.get(f)
  if (!im.size && !(ex && ex.size) && !(amb && amb.size)) continue
  console.log(`\n### ${f}`)
  if (im.size) {
    const byMod = new Map()
    for (const [name, owner] of [...im.entries()].sort()) {
      if (!byMod.has(owner)) byMod.set(owner, [])
      byMod.get(owner).push(name)
    }
    for (const [owner, names] of byMod) {
      console.log(`  import { ${names.join(', ')} } from '${rel(f, owner)}'`)
      totalImports += names.length
    }
  }
  if (ex && ex.size) {
    for (const [name, consumers] of ex) {
      const d = decls.get(f).get(name)
      console.log(`  export  ${name} (${d.kind}${d.exported ? ', already exported' : ''}) <- ${[...consumers].join(', ')}`)
      if (!d.exported) totalExports++
    }
  }
  if (amb && amb.size) console.log(`  AMBIGUOUS (local shadow, review!): ${[...amb].join(', ')}`)
}
console.log(`\n${totalImports} imports to add, ${totalExports} exports to add`)

// --- apply -------------------------------------------------------------------
if (WRITE) {
  for (const f of FILES) {
    let src = read(f)
    const own = decls.get(f)
    const im = needs.get(f)
    // imports: skip names already imported
    const existing = new Set()
    for (const mm of src.matchAll(/^import\s*\{([^}]*)\}\s*from\s*'[^']+'/gm)) {
      for (const p of mm[1].split(',')) existing.add(p.trim())
    }
    const byMod = new Map()
    for (const [name, owner] of im) {
      if (existing.has(name)) continue
      if (!byMod.has(owner)) byMod.set(owner, [])
      byMod.get(owner).push(name)
    }
    const lines = []
    for (const [owner, names] of [...byMod.entries()].sort()) {
      lines.push(`import { ${names.sort().join(', ')} } from '${rel(f, owner)}'`)
    }
    if (lines.length) {
      // keep a leading // doc-comment block at the very top
      const head = src.match(/^(\/\/[^\n]*\n)+/)
      const at = head ? head[0].length : 0
      src = src.slice(0, at) + (at && src[at] !== '\n' ? '\n' : '') + lines.join('\n') + '\n' + (at ? '' : '') + src.slice(at)
    }
    // exports
    const ex = usedBy.get(f)
    if (ex) {
      for (const name of ex.keys()) {
        const d = own.get(name)
        if (!d || d.exported) continue
        const esc = name.replace(/[$]/g, '\\$&')
        const re = new RegExp(`^(${d.kind.replace(' ', '\\s+')}\\s+)${esc}(?![\\w$])`, 'm')
        if (!re.test(src)) { console.error(`cannot export ${name} in ${f}: declaration not found`); continue }
        src = src.replace(re, 'export $1' + name)
      }
    }
    fs.writeFileSync(path.join(CLIENT_DIR, f), src)
  }
  console.log('applied.')
}
