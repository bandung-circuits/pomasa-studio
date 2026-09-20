# task-manager

## 职责
任务数据层（`store.js`）：轮询 `unit.list` 树、`unit.state`、generation.status；`selectTask` / `addUnit` / `addTask` / rename / remove。

与 `task-tree` 的分工：
- **task-tree + tree-child**：左栏 UI
- **task-manager**：数据；不操作 DOM

## 槽位
无 UI。`useTaskManager()` 订阅 snapshot（引用稳定）。

## 事件
发出：`task.open`（selectTask）
订阅：`mas.open` / `mas.created` / `unit.prompt` / `unit.new` / `task.new` / `unit.delete*` / `unit.rename` / `task.delete*` / `task.rename` / `task.open` / `layout.boot`

## Services
`getMas`、`unit.list`、`unit.state`、`unit.add`、`unit.rename`、`unit.remove`、`task.create`、`task.rename`、`task.remove`、`generation.status`
