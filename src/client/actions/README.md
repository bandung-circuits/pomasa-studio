# actions — 全局事件总线

## 职责
跨模块副作用通知。纯 pub/sub，无级联、无负载约定。

## 规则
- **store 方法允许直调**：同模块或明确依赖方向内，直接调 store 方法（如 `taskManager.selectTask`、`configStore.setGridSizes`），不要绕 bus。
- **bus 仅用于跨模块副作用通知**：一个模块的动作需要**别的模块**做出反应，且不应产生直接依赖时用 bus（如 `task.open` 通知 file-reader 关闭查看器、`layout.boot` 通知各模块复位）。
- 不为「本模块内部闭环」建事件（发事件→自己监听→调自己的 store，应直调）。
- 发事件前先确认有订阅方；订阅前确认有发出方。死事件直接删。

## 槽位
无 UI；被 `workbench/app.js` 与各模块订阅。

## 事件
| 事件 | 发出方 | 订阅方 |
|------|--------|--------|
| `layout.boot` | work 标题返回 / MAS 删除后 | workbench, task-manager, file-reader, studio-mode |
| `layout.work` | MAS 打开 | workbench |
| `mas.open` | MAS-list | workbench, task-manager |
| `mas.create` | boot-toolbar | workbench → 打开 creator |
| `settings.open` | boot-toolbar / work 标题 | workbench |
| `mas.created` | workbench（进入已生成 MAS） | task-manager |
| `task.open` | task-manager.selectTask | file-reader（关查看器） |
| `unit.prompt` | task-tree 标题 + | task-manager → promptDialog |
| `menu.open.tree.*` | tree-child 右键 | menu-service → 条目 action |
| `unit.delete.ask` / `task.delete.ask` | menu-service | task-manager → 确认对话框 |
| `unit.delete` / `unit.rename` / `task.delete` / `task.rename` | menu-service / tree-child / 确认框 | task-manager |
| `unit.reveal` / `task.reveal` | menu-service | task-manager → 系统文件管理器 |
| `unit.rename.pre` / `task.rename.pre` | menu-service | tree-child（进入行内重命名） |
| `run.start` / `run.cancel` | operation-controller / file-reader rerun / task-tree | workbench（driveSession） |
| `run.choose` | task-tree（已有产物） | file-reader RerunModal |
| `file.open` | subagent-details / orchestrator | file-reader |
| `agent.chat.select` | studio-mode / orchestrator | chat |
| `execute.mode.on` / `design.mode.on` | studio-mode | chat |

## Services
无；纯客户端状态。
