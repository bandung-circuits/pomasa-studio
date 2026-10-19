import path from 'node:path'
import { promptLangFromMasRoot, promptT } from '../prompts/index.js'

export function designUserText(masRoot, declared, lang) {
  const l = lang || promptLangFromMasRoot(masRoot)
  const lines = (declared || [])
    .map((a) => {
      const bp = a.agent ? path.join(masRoot, a.agent) : a.agent
      return `- ${a.key}: ${bp} (${a.title || a.key})`
    })
    .join('\n')
  return promptT(l, 'design.user', {
    reply: promptT(l, 'prompt.reply'),
    masRoot,
    agents: lines || promptT(l, 'design.agents.empty'),
  })
}

export function designAssistantText(lang) {
  return promptT(lang || 'zh', 'design.assistant')
}
