# nodes-container

## 职责
中央 **工作流画布** 容器（phase 2）。生成中仍走 `GenerationPanel`；已生成 MAS 渲染 `WorkflowCanvas`。

## 数据
- 图从 `pomasa.json` 推导（host/client 各有一份 `data/graph.js`）
- 每行一个 **OrchestratorShell**（启动器容器）+ 内嵌 stage subagent 序列

## UI
- `ScrollBox mode=canvas`：1440×960 画板 + CSS zoom；外包 ScrollFrame
- 生成中 / loading：`ScrollFrame` + 默认 `ScrollBox`
- 标题栏 **缩放** 按钮（`nodes.zoom`）滑块 50%–200% → `partScrollStore`
- 标题栏 **展开** 按钮（`nodes.expand`）→ `SecondaryWindow`（`registerSecondaryTitleAction` + `registerSecondaryScroll`）
- 二级窗口标题栏复用 part 样式，并注册 **缩放**（`nodes.zoom`）
- 节点选中 → `taskManager.selectAgent` → `locators.agentKey` + `node.select`
- 每 3s 轮询 `subagent.list` 刷新节点「已登记 / 存活」状态

## 事件
- 订阅 `node.select`（产物过滤在 `subagent-details`）
- 不写入 `pomasa.json`（只读可视化）
