# orchestrator (client)

## 职责
**OrchestratorShell** — 一组 subagent 的启动器 / 画布容器，**不是** subagent 节点。

## 布局
- 外层 `.ps-orch-shell`：标题、状态、蓝图/对话
- 内层 `.ps-canvas-stages`：stage subagent 序列 + 24px 连线

## 滚动 / 缩放
- 由 `nodes-container` 的 `ScrollBox mode=canvas` 承担（1440×960 + zoom）
- 滚动在 ScrollFrame 内，不泄漏到 part-body

## 数据
`row.orchestrator` + `row.stages[]` + `row.edges[]`（边仅连接 stage 节点）
