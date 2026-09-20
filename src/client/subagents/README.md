# subagents (client)

## 职责
阶段 **SubagentNode** 卡片（仅 `kind: stage`）：标题、状态点、契约色、三动作按钮。

Orchestrator 不是 subagent，由 `orchestrator/row.js` 的 **OrchestratorShell** 单独渲染。

## 三动作
1. **蓝图** → `file.open`（agent 蓝图 md）
2. **产物** → `taskManager.selectAgent`（下方 `subagent-details` 按 `agentKey` 过滤；**不**触发 chat）
3. **对话** → `agent.chat.select` 仅（**不**改 `subagent-details` 选中）

**卡片点击** → `taskManager.selectAgent` + `agent.chat.select`（产物 + 对话）。

Design 模式下 chat 按钮不依赖 run sessionId（始终可点，向 composer 插入 agent id）。

## 状态
- `aliveMap` 来自 `subagent.list`（3s poll）
- `registered` — task 已登记 sessionId（含 parked）
- `live` — DSH live registry（可发消息）
- `alive` — 正在 running
