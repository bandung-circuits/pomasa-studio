import path from 'node:path'
import { promptLangFromMasRoot } from './locale.js'
import { promptT } from './strings.js'

function isOrchestrator(agent) {
  return agent && (agent.kind === 'orchestrator' || agent.key === 'orchestrator')
}

export function standbyUserText(agent, masRoot, unitRoot, lang) {
  const l = lang || promptLangFromMasRoot(masRoot)
  const bp = agent.agent ? path.join(masRoot, agent.agent) : agent.agent
  const reply = promptT(l, 'prompt.reply')
  if (isOrchestrator(agent)) {
    return promptT(l, 'warm.orch.user', { reply, blueprint: bp, unitRoot })
  }
  return promptT(l, 'warm.stage.user', {
    reply,
    title: agent.title || agent.key,
    key: agent.key,
    blueprint: bp,
    unitRoot,
  })
}

export function standbyAssistantText(agent, lang) {
  const l = lang || 'zh'
  if (isOrchestrator(agent)) return promptT(l, 'warm.orch.assistant')
  return promptT(l, 'warm.stage.assistant', { title: agent.title || agent.key })
}
