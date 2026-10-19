# chat (client)

## 职责
右栏节点对话面板 `AgentChatPanel`（`work.right` grid 下半格）。**不**自绘消息/composer，而是把 DSH 主页 `ConversationRoot`（`[data-conversation-scroll]` 及其 composer）**视觉对齐**到本 part 占位盒。

## 模式

- **Execute**：绑定当前 task 的编排器/子代理 session（`/pomasa/subagent.info`）；编排器 alive 时 composer 锁定。
- **Design**：绑定 `design.start` 返回的 MAS 根 cwd 会话；`agent.chat.select` 向 `[data-composer-seat] textarea` 插入 agent id；发送前自动前置 `[design-focus: …]` 标记。

## 布局

```
ps-part-body-chat
  ps-native-conversation-host
    ps-native-conversation-seat   ← ResizeObserver 对齐目标
```

主页 ConversationRoot 仍挂在 `CenterColumn` 的 React 树下；仅用 `position: fixed` 对齐到 seat，**不** `appendChild`。

## 绑定

- Execute：`locators.agentKey` / `agent.chat.select` → `/pomasa/subagent.info` → `sessionId`
- Design：`design.mode.on` → 固定 `designSessionId` → `sessions.open`
- 编排器：`sessions.open(sessionId)`
- 子 agent：`sessions.openSubagent({ parentSessionId, childSessionId, mode: 'continuable' })`
- 进入工作台前记住 `list.current` / `currentAddress`；overlay 关闭或失去 bind 时 **restore**

## 模块

- [`native-seat.js`](native-seat.js) — `NativeConversationSeat`、`buildNativeBind`、dock/undock
- [`design-composer.js`](design-composer.js) — Design 模式 composer 插入与发送 hook
- [`panel.js`](panel.js) — locators + mode + subagent 信息 → `bind` + `active`

## 注意

- 选择器用 `[data-conversation-scroll]` / `[data-composer-seat]`，不用 CSS Modules 哈希 class
- 不再轮询 `/pomasa/agent.log` 作为对话源；原生 mux + history 由 DSH runtime 负责
- `subagent.list` 轮询仍只用于节点 live/alive 灯，与对话通道解耦
