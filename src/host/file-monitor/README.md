# file-monitor (host)

## 职责
可替换的文件监视基类；变更通知供 client actions 刷新（替代 3s poll）。

## 现实现
[`monitor.js`](monitor.js) — `FileMonitor` + `createFileMonitor(root, onChange)`，内部 `fs.watch`。

**本轮未挂到 apply**（避免与 task-manager 轮询双通道）。

## 二期
- 监视 `~/.pomasa/<mas>/workspace/` 下 run.json / index.json
- client `services` 订阅 → `task.refresh` action
