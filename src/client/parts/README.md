# parts — 布局槽位

## 职责

`layoutSlots.register({ id, region, order, title, description, render })` — 声明 part。
`PartFrame`：36px 标题 + `.ps-part-body`（直接渲染 children，不代管滚动）。

## 滚动

会溢出的组件在内部使用 `ScrollFrame` + 默认 `ScrollBox`。见 [`scrollbox/README.md`](../scrollbox/README.md)。

## 标题栏扩展

`registerTitleAction({ partId, id, order, render })` — 按 `order` 升序排列标题右侧按钮（数字越大越靠右）。

Boot 页工具栏用 [`boot-toolbar/actions.js`](../boot-toolbar/actions.js) 的 `registerToolbarAction`（竖向图标轨，非 part 标题栏）。

示例：

- `boot-content` / `mas.view.list` / `mas.view.cards` — MAS 列表视图切换（见 [`MAS-list`](../MAS-list/list.js)）
- `task-tree` / `unit.add` — 新增单元（`PsButton id='add'`）
- `nodes-container` / `nodes.zoom` — 画布缩放
- `nodes-container` / `nodes.expand` — 二级窗口展开画布（见 [`secondary-window`](../secondary-window/README.md)）

## 槽位 region

- boot.title / boot.toolbar / boot.content / boot.footer
- work.title / work.left / work.center / work.right / work.bottom

## 层级

Part 使用 `psHierarchyMainProps()`（main / 0）；浮层由 hierachy 模块计算 z，Part 不管理 overlay 层级。
