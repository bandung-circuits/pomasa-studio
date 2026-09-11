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

export function standbyUserText(agent, masRoot, unitRoot) {
  const bp = agent.agent ? `${masRoot}/${agent.agent}` : agent.agent
  if (agent.kind === 'orchestrator' || agent.key === 'orchestrator') {
    return `你是本 MAS 的编排者（Orchestrator）待机实例。请先阅读蓝图：${bp}

当前任务单元根（运行沙箱）：${unitRoot}
请保持待机，等待研究者启动运行或发出指令后再按蓝图编排各阶段。不要自行开始阶段工作或写产物。`
  }
  return `你是阶段子代理「${agent.title}」（${agent.key}）的待机实例。请先阅读蓝图：${bp}

当前任务单元根：${unitRoot}
请保持待机，等待编排者（Orchestrator）调度后再执行本阶段任务。不要自行开始工作或在单元根外写入文件。`
}

export function standbyAssistantText(agent) {
  if (agent.kind === 'orchestrator' || agent.key === 'orchestrator') {
    return '已就位。我已阅读待机指示，将保持待机，等待运行指令后再按蓝图编排各阶段。'
  }
  return `已就位。我是阶段子代理「${agent.title}」，将保持待机，等待编排者调度。`
}
