# actions — 全局事件总线

## 职责
跨组件广播与订阅；根事件可级联触发子事件（见 `ACTION_CHILDREN`）。

## 槽位
无 UI；被 `workbench/app.js` 与各模块订阅。

## 事件
| 事件 | 发出方 | 订阅方 |
|------|--------|--------|
| `layout.boot` | work 标题返回 | workbench |
| `layout.work` | MAS 打开 | workbench |
| `mas.open` | MAS-list | workbench, locators |
| `mas.create` | boot 标题 | workbench → 打开 creator |
| `mas.created` | MAS-creator 提交 | workbench → work 页 |
| `task.open` | task-manager / task-tree | file-reader, task-manager |
| `unit.prompt` | task-tree 标题 + | task-manager → promptDialog → unit.new |
| `menu.open.tree.*` | tree-child 右键 | menu-service → 条目 action |
| `unit.delete` / `unit.rename` / `task.delete` / `task.rename` | menu-service / tree-child | task-manager |
| `run.start` / `run.cancel` | operation-controller / file-reader rerun | workbench（driveSession） |
| `run.choose` | operation-controller（已有产物） | file-reader RerunModal |
| `file.open` | nodes-container / subagent-details | file-reader |
| `settings.open` | title bars | workbench |

## Services
无；纯客户端状态。
