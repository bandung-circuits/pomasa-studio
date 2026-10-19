# services (host) — 后台事件总线

host 模块域事件总线：`on(event, fn)` / `emit(event, payload)` / `clear()`。

当前发出方：`file-system` 的 `file.change`（write/remove/rename）。
当前订阅方：`file-monitor/hub.js` — 按 mas root 路径前缀过滤后喂入窗口节流，
与 monitor 自己的 fs 事件合并，经 SSE（`/pomasa/events`）推给 client。

注意：`file.change` 只覆盖经 fsx 的写入；raw fs 写入（如 addUnit）不经过总线，
由 monitor 的 watch/poll 策略兜底。
