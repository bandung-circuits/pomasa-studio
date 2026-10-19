import fs from 'node:fs'
import path from 'node:path'
import { loadDescriptor } from '../data/descriptor.js'

const ZH_RE = /^(zh([-_]|$)|chinese\b|中文|汉语|简体|繁体)/i
const EN_RE = /^(en([-_]|$)|english\b|英文|英语)/i

/**
 * Prompt language is the MAS blueprint language, not the Studio UI language.
 * Only zh / en wrappers exist; unknown non-Chinese values use en so the model
 * is not primed in Chinese.
 */
export function normalizePromptLang(value) {
  const s = String(value || '').trim()
  if (!s) return null
  if (ZH_RE.test(s) || /[\u4e00-\u9fff]/.test(s)) return 'zh'
  if (EN_RE.test(s)) return 'en'
  return 'en'
}

export function promptLangFromValue(value) {
  return normalizePromptLang(value) || 'zh'
}

export function promptLangFromDescriptor(descriptor) {
  if (!descriptor) return null
  const lang = descriptor.language
  if (!lang) return null
  if (typeof lang === 'string') return normalizePromptLang(lang)
  return normalizePromptLang(lang.blueprint || lang.report)
}

function promptLangFromUserInput(masRoot) {
  try {
    const txt = fs.readFileSync(path.join(masRoot, 'user_input.md'), 'utf8')
    const m = txt.match(/\*\*Agent Blueprint Language\*\*:\s*([^\n]+)/i)
    if (m) return normalizePromptLang(m[1].trim())
  } catch { /* no user_input or unreadable */ }
  return null
}

export function promptLangFromMasRoot(masRoot) {
  return promptLangFromDescriptor(loadDescriptor(masRoot))
    || promptLangFromUserInput(masRoot)
    || 'zh'
}
