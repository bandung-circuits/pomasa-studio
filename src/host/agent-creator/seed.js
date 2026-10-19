export { standbyAssistantText, standbyUserText } from '../prompts/warmup.js'

function seedMsgId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Minimal closed-turn seed for idle agent prebuild (zero LLM).
 * Subagents include subagent/descriptor for cold resume.
 */
export function standbySeed({ userText, assistantText, provider, model, subagentLabel }) {
  const t0 = Date.now()
  const events = []
  let seq = 0
  const push = (type, data, extra = {}) => {
    events.push({ type, seq: seq++, time: t0 + seq, data, ...extra })
  }

  if (subagentLabel) {
    push('subagent/descriptor', {
      version: 2,
      mode: 'continuable',
      provider: 'spawn',
      label: subagentLabel,
      agentProvider: provider,
      agentModel: model,
    })
  }

  push('turn/start', { turn: 1, trigger: { kind: 'message' } })
  push('step/start', { turn: 1, step: 1 })
  push('user/message', {
    id: seedMsgId('user'),
    role: 'user',
    content: [{ type: 'text', text: String(userText || '') }],
    source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  push('assistant/message', {
    turn: 1,
    step: 1,
    message: {
      id: seedMsgId('asst'),
      role: 'assistant',
      content: [{ type: 'text', text: String(assistantText || '') }],
      source: { kind: 'model', provider: provider || 'deepseek-official', model: model || 'deepseek-chat' },
    },
  }, { surfaceOp: 'append' })
  push('step/end', { turn: 1, step: 1 })
  push('turn/end', { turn: 1, reason: { kind: 'completed' } })
  return events
}
