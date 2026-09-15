# services (host) — 后台事件总线

host 模块域事件总线：`on(event, fn)` / `emit(event, payload)` / `clear()`。

当前发出方：`file-system` 的 `file.change`（write/remove/rename）。
当前订阅方：无（client 仍走 3s poll）。

**三期保留**：配合 `file-monitor`，作为「文件变更 → client 刷新」推送通道，
替代 task-manager 轮询；届时订阅方在 apply 装配。
