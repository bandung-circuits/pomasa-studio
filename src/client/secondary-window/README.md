# secondary-window — 二级窗口

与 Part 标题栏一致的注册 API + 可注册滚动 body。

## API（`window.js`）

- `SecondaryWindow({ windowId, open, onClose, title, description, children })` — portal 到 overlay；标题栏复用 `.ps-part-title` 样式
- `registerSecondaryTitleAction({ windowId, id, order, render })` — 同 `registerTitleAction`，按 `windowId` 分组
- `registerSecondaryScroll({ windowId, Wrap })` — 注册 body 滚动包装组件（接收 `children`）

默认滚动：`ScrollFrame` + 默认 `ScrollBox`。

## 用例

- [`nodes-container/expand.js`](../nodes-container/expand.js) — 展开工作流画布
- [`nodes-container/scroll.js`](../nodes-container/scroll.js) — `NodesContainerScrollWrap`（canvas zoom）
