# layout — 页面布局

## boot (`boot.js`)
槽：`boot.title`（页顶栏）、`boot.content`（PartFrame + MAS 列表）。

## work (`work.js`)
纵向三层壳：
1. **title** — `work.title` 页顶栏
2. **middle** — `GridView` 横向三栏（`WorkLeftStage` | `WorkStage` | `work.right`）；生成中仅中央
3. **bottom** — `WorkBottomBar` 状态条（可隐藏）

`WorkLeftStage` = `work.left` 纵向网格：上 `task-tree`、下 `studio-mode`（Execute / Design 切换）。

`WorkStage` = `work.center` 纵向网格：上 `nodes-container`、下 `subagent-details`。

## Services
无。数据在 locators / task-manager / studio-mode store。
