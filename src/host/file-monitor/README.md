# file-monitor (host)

## 职责
可替换的文件监视基类；变更通知供 client 刷新（替代 3s poll）。

## 现实现
[`monitor.js`](monitor.js) — `FileMonitor` + `createFileMonitor(root, onChange)`，内部 `fs.watch`。

**三期保留**：本轮刻意未挂到 apply（避免与 task-manager 轮询双通道）；
配合 `host/services` 事件总线（`file.change`）在三期替代 client 3s poll。

## 三期路线
- 监视 `~/.pomasa/<mas>/workspace/` 下 run.json / index.json
- client 订阅推送通道 → 触发 task-manager store 刷新
