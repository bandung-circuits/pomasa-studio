# agent-creator (host)

## 职责
通过 DSH `ctx.agents.create` **idle 预建** agent/subagent（研究报告 C 路），注入待机 seed 对话，**零 LLM**。

## API
- `ensureRunTree({ masId, unitKey, taskKey, masRoot, unitRoot, opts })` — 编排器 + 各 stage 子代理，cwd=任务根
- `ensureRoot` / `ensureChild` — 单节点预建（可复用）
- `attachToCwdWorkspace(sessionId, cwd, title)` — 任务目录 workspace 入账
- `followup(sessionId, text)` — host 侧对 live agent 发消息
- `agentSessionId(masId, unitKey, taskKey, agentKey)` — 稳定 session id

## Preset / 工具
预建时在 `agents.create` / `resume` 的 **`setup`** 里挂载 preset（与 Web `session.create` → `composeAgent` 一致）：
- **编排器**：`ctx.agentPresets.mount(agentCtx, presetId)`
- **子代理**：`ctx.agentPresets.composeFrom(agentCtx, parent.ctx)`（继承父 preset 工具表）

仅写 `meta.agentPreset` **不会**装工具；缺 setup 时模型会把 DSML 当普通文本输出。

## 子代理 parking（send_message 冷恢复）
Stage 子代理 seed 落盘后 **`handle.dispose()`**，只留 persistence（`list_agents` 显示 **ready**）。编排器保持 live，client 仍 `followup(runPrompt)`。

`send_message` 走 `ctx.subagents.followup` → `coldResume` → `agents.resume`；若子代理仍占 live registry 会报 `unavailable`。已污染的旧 task 请 **New task & run**。

编排者应用 `send_message` 投递后等待 DSH 的 **`subagent-settled`** 结算通知，**不要**用 `list_agents` 轮询或 bash sleep 等待产物；`runPrompt` / `runPromptWithRoster` 已写入该协议。

## Seed
[`seed.js`](seed.js) 写入闭合 turn +（子代理）`subagent/descriptor`（`mode: continuable`），供冷恢复与 chat 展示待机对话。不要设置 `seedLength`（descriptor 须在 slice 起点）。待机提词语言跟 MAS 蓝图语言走（见 [`../prompts/README.md`](../prompts/README.md)），避免英文 MAS 被中文系统提词带偏。

## 约束
- **不**伪造 `~/.dsh/sessions` 文件
- cwd = `workspace/{unit}/{taskId}/`（与 attachSession 自洽）
- 编排器调度子代理用 `list_agents` / `send_message`，**禁止** subagent 工具新建
