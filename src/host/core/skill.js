import fs from 'node:fs'
import path from 'node:path'
import { pomasaHome, packagedSkillDir } from '../paths/index.js'

/**
 * The POMASA skill snapshot is materialized under ~/.pomasa/skills/pomasa/<version>.
 * The version is read from the packaged SKILL.md frontmatter (metadata.version),
 * so it tracks the skill itself rather than a metadata schema namespace.
 */
const SKILL_DIRNAME = 'pomasa'
const SKILL_MD = 'SKILL.md'

function skillVersion() {
  try {
    const text = fs.readFileSync(path.join(packagedSkillDir(), SKILL_MD), 'utf8')
    // read `version` from the YAML frontmatter (it is nested under metadata:)
    const fm = text.match(/^---\n([\s\S]*?)\n---/)
    const m = (fm ? fm[1] : text).match(/^\s*version:\s*["']?([0-9][^\s"']*)/m)
    if (m) return m[1]
  } catch { /* fall through */ }
  return '0'
}

/** Skill snapshot location inside ~/.pomasa, pinned by the skill version. */
export function skillDir(home) {
  return path.join(home, 'skills', SKILL_DIRNAME, skillVersion())
}

/**
 * Materialize the packaged POMASA skill snapshot into
 * ~/.pomasa/skills/pomasa/<version>. Idempotent: if the pinned version already
 * exists, it is left untouched. The legacy "obv-1" layout (named after the OBV
 * schema version) is migrated away when present.
 */
export function ensureSkill(config) {
  const home = pomasaHome(config)
  const target = skillDir(home)
  if (fs.existsSync(target)) {
    migrateLegacySkill(home, target)
    return target
  }
  const src = packagedSkillDir()
  fs.mkdirSync(target, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    fs.cpSync(path.join(src, name), path.join(target, name), { recursive: true })
  }
  migrateLegacySkill(home, target)
  return target
}

function migrateLegacySkill(home, target) {
  const legacy = path.join(home, 'skills', 'obv-1')
  if (legacy === target || !fs.existsSync(legacy)) return
  try {
    fs.rmSync(legacy, { recursive: true, force: true })
  } catch { /* non-fatal */ }
}
