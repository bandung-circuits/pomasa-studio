# subagent-manager (host)

## 职责
声明式 subagent 生命周期：listDeclared、warmPrompt、listAlive、getInfo、getAgentLog。

## 实现
[`manager.js`](manager.js)：
- `listDeclared(masId)` — orchestrator + 各 stage
- `warmPrompt` / `buildWarmAgents` — 待机文案（供 seed 与文档）
- `listAlive` / `getInfo` — 读 registry `lastAgentSessionIds` + live/running 状态
- `getAgentLog` — 校验 task registry 后 `persistence.inspect` 返回 events

**状态语义**
- `registered` — `lastAgentSessionIds` 里有 sessionId（含 parked 子代理）
- `live` — 仍在 DSH live agent registry（可 `session.prompt`）
- `alive` — live 且 `status === 'running'`

**运行预热**由 [`agent-creator`](../agent-creator/README.md) 在 `run.start` 时 `ctx.agents.create` 预建（cwd=任务根），stage 子代理 seed 后 park；不再由 client 逐个 `driveSession`。

## HTTP
- `GET /pomasa/subagent.list?masId&unit&task`
- `GET /pomasa/subagent.info?masId&agentKey&unit&task`
- `GET /pomasa/agent.log?masId&agentKey&unit&task` — 只读 persistence 对话
