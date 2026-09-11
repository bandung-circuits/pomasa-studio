# chat (client)

## 职责
右栏节点对话面板 `AgentChatPanel`（`work.right` grid 下半格，可拖拽缩放）。

## 布局
对齐 DSH `ConversationRoot` + `InputBar` 几何（不二次挂载主 UI `conversation` slot）：

```
ps-part-body-chat
  ScrollFrame (80%) > ScrollBox > head + 消息
  ps-chat-composer-seat (20%)
```

滚动在 ScrollFrame；composer 与 Frame 并列，不进 Box。

## 绑定
- `locators.agentKey` → `api.subagentInfo` → `sessionId` / `registered` / `live` / `alive`
- **状态刷新**：`subagent.list` 3s 轮询 → `subagentClient` 缓存 → chat 同步 `live`/`alive`；chat 另每 3s `subagentInfo`
- **历史**：`sessionDriver.watch(sid, cb, { masId, unitKey, taskKey, agentKey, live })`
  1. 立即 + 每 2.5s `GET /pomasa/agent.log`（parked / 无 live 绑定时仍更新）
  2. 若 `live`：`sessions.open` / `openSubagent` + `subscribe` + `getSnapshot`（运行中增量）
  3. 空 live snapshot **不覆盖** persistence 历史
- **发送**：`sessionDriver.followup(sid, text)` — 仅 `live` 时启用 composer

## 注意
Parked 子代理不对 DSH 主 UI 调 `sessions.open`（避免闪一下再清空）。编排器 live 时仍可用 followup。
