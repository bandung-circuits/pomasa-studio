# temporary-window — 锚定临时工具窗

按钮触发的轻量 popover；可 hover 保持，失焦/外部点击/Escape 关闭。

## API（`window.js`）

- `TemporaryWindow({ anchorRef, open, onOpenChange, hierarchyBase, children })`
- z：`psHierarchyProps('temporary', hierarchyBase)`

## 用例

`nodes-container/zoom.js` — 缩放按钮 + range 滑块 → `partScrollStore.setScale('nodes-container', …)`。
