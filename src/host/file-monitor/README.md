# file-monitor (host)

## 职责
文件变更侦测 + 节流推送，替代 client 3s 轮询（task-manager store、subagent.list 已由 SSE 驱动）。

## 最小监听原则
每个任务只监听自己需要的范围；只有确实需要监听大量文件的任务才用轮询策略。
- mas 范围（task-manager / subagent.list）→ watch + SSE 推送
- home 范围（MAS-list 多目录）→ client 保留 HTTP 轮询
- dialogue 生成日志（对话框生命期内的有界轮询）→ 不动

## 组成

### [`monitor.js`](monitor.js) — 策略化监视器
`createFileMonitor(root, onChange, { strategy, intervalMs, recursive, ignore })`
- `strategy: 'watch'`（默认）：`fs.watch` recursive；平台不支持（Linux）抛错时自动降级为 poll
- `strategy: 'poll'`：每 `intervalMs`（默认 3000）递归 walk，采集 `path:mtimeMs:size` 快照（上限 5000 条）做 diff，有差异才回调——轮询作为一种监听方式在此实现
- `ignore`：默认跳过 `.` 开头文件（软删除隐藏标记）

### [`throttle.js`](throttle.js) — 窗口节流
`createChangeThrottle(fire, windowMs)`：
- 首次变化立即 fire 并开窗口；窗口内变化只记 dirty
- 窗口结束有 dirty → fire 并链式开新窗口；无 dirty → 链停止
- 定时器可注入（L1 假定时器测试）

### [`hub.js`](hub.js) — 监听枢纽
`createWatchHub({ config, home })`：
- 按 mas root 惰性建 monitor + monitor 级节流（窗口取 `config.fileWatchWindowMs ?? 3000`），refcount 订阅者，归零关闭
- 双事件源喂同一 throttle：monitor 的 fs 事件 + services 总线 `file.change`（按路径前缀过滤，覆盖 fs.watch 盲区与 poll 间隔）
- `handleEvents(q, res, req)`：SSE 端点 `GET /pomasa/events?masId=…`，推送节流后的 change 事件，25s 心跳；handler 返回的 Promise 在连接关闭时才 resolve

## client 侧
`src/client/services/event-stream.js` — 按 masId refcounted 共享 EventSource；从未 open 就 error（旧 host 无端点）→ `onUnsupported`，调用方回退原轮询；open 后的 transient error 交给 EventSource 原生重连。
