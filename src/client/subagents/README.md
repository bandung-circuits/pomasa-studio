# subagents (client)

## 职责
阶段 **SubagentNode** 卡片（仅 `kind: stage`）：标题、状态点、契约色、三动作按钮。

Orchestrator 不是 subagent，由 `orchestrator/row.js` 的 **OrchestratorShell** 单独渲染。

## 三动作
1. **蓝图** → `file.open`（agent 蓝图 md）
2. **产物** → `node.select`（下方 `subagent-details` 按 `agentKey` 过滤）
3. **对话** → `agent.chat.select`（无登记会话时禁用）

## 状态
- `aliveMap` 来自 `subagent.list`（3s poll）
- `registered` — task 已登记 sessionId（含 parked）
- `live` — DSH live registry（可发消息）
- `alive` — 正在 running
