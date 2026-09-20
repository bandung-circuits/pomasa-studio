# task-runner (host)

## 职责
单次 task 运行准备：`run.start`、fresh 清盘、`run.intervene` / `run.cancel` / `run.log`。

## 现实现
[`run.js`](run.js)：
- `resolveRunTargets` → `workspace/{unit}/{taskId}/`
- `run.start` 调用 [`agent-creator`](../agent-creator/README.md) `ensureRunTree`：在任务根 cwd **idle 预建**编排器 + 各 stage 子代理（standby seed，零 LLM），写入 `lastAgentSessionIds`
- 返回 `prompt`（带子代理 roster：`list_agents` / `send_message`，禁止 subagent 工具新建）、`orchestratorSessionId`、`agents[]`（含 `sessionId`）
- client **仅**对编排器 sid `followup(prompt)` 开跑；不再逐个 `driveSession`
- `registerDeclaredAgents()` 现为 **no-op**（登记由 agent-creator + registry 完成）

## 约束
- cwd = 任务根（DESIGN 决策 9/11）；`attachSession` 挂任务目录 workspace，非 POMASA 根
- 编排器复用预建子 sid；调度走 durable sessionId + `send_message`；完成以 DSH `subagent-settled` 通知为准（见 `runPrompt` 调度协议），不用 `list_agents`/bash 轮询
