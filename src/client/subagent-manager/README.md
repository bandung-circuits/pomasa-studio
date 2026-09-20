# subagent-manager (client)

## 职责
Client 侧 `agentKey → sessionId` 缓存，对接 host `/pomasa/subagent.*` 与 `/pomasa/agent.log`。

## API
- `refreshSubagentInfo(api, masId, unitKey, taskKey, agentKey)`
- `refreshSubagentList(api, masId, unitKey, taskKey)` — 批量刷新 `aliveMap`

## Store
`subagentClient` — 按 `masId|unit|task|agentKey` 键缓存 `{ sessionId, alive, live, registered, agent }`。
`taskManager.reset()` 时 `clear()`。

- `registered` — task registry 有 sessionId（含 parked）
- `live` — DSH live registry（可发消息）
- `alive` — 正在 running
