UI + data model

Boot `boot.content` part（`PartFrame` 标题 `boot.recent` →「最近的项目」）。

## 职责

- 读取 MAS 列表，卡片 / 列表两种视图（`MAS-list/view.js`）
- 标题栏视图切换：`text-list` / `card-list`（`registerTitleAction`）
- 点击条目 → `mas.open`

新建 / 设置 / 关闭见 [`boot-toolbar`](../boot-toolbar/toolbar.js)。

## 标题栏

- `mas.view.list` — 列表视图
- `mas.view.cards` — 卡片视图
