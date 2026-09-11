# scrollbox — ScrollFrame + ScrollBox

滚动由 **ScrollFrame** 自主管理，不泄漏到 `.ps-part-body`。

## API（`box.js`）

- **`ScrollFrame({ className, children })`** — `.ps-scroll-frame`，`overflow: auto`。纯滚动视口。
- **`ScrollBox({ mode, scale, className, children })`** — 内容层，默认不自包 Frame。
  - `mode: 'default'`（默认）— `width: 100%`，`height: auto`，**无 zoom**
  - `mode: 'canvas'`（nodes 衍生）— 内层 1440×960 + `zoom: scale`；**外包 ScrollFrame**
- `partScrollStore.setScale(partId, scale)` — 0.5–2.0，仅 canvas 使用
- `usePartScrollScale(partId, enabled)` — React hook

## 用法

普通 part（组件内显式套两层）：

```js
h(ScrollFrame, null, h(ScrollBox, null, children))
```

Chat（Frame 与 composer 并列于 `ps-part-body`）：

```
ps-part-body-chat
  ScrollFrame > ScrollBox > head + messages
  ps-chat-composer-seat
```

Nodes 画板（一行 canvas ScrollBox，内含 Frame）：

```js
h(ScrollBox, { mode: 'canvas', scale }, h(WorkflowCanvas, props))
```

PartFrame **不再**代管 ScrollBox；各组件自行挂 Frame。
