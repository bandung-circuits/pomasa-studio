# workbench — 工作台根

## 职责
切 boot/work、挂 overlay（creator / settings / dialogue / file-reader）、把 DSH 会话驱动接到 `run.start` / `run.cancel` / 生成。

## 槽位
`main.js` → `shell.overlay`。布局槽由 `parts/slots.js` 的 `registerStudioSlots` 注册。

## 事件
订阅：`layout.boot` / `layout.work` / `mas.create` / `settings.open` / `run.start` / `run.cancel`
发出：`mas.created`（创建完成后）

## Services
`getServices()`；`onRun` / `onGeneration` 来自 `main.js` 的 driveSession。
