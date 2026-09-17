# layout — 页面布局

## boot (`boot.js`)

Visual Studio 启动页风格：

1. **title** — `boot.title` 页顶栏（BootSign + 设置 + 关闭）
2. **hero** — `Welcome to POMASA Studio`（`boot.welcome`）
3. **split**（画面居中）— 左 `boot.content` Recent 列表 | 右 `boot.toolbar` 开始使用 + 操作行
4. **footer** — `boot.footer` 轮播提示栏（使用说明 + GitHub 链接）

## work (`work.js`)

纵向三层壳：

1. **title** — `work.title` 页顶栏（含模式切换 icon，设置左侧）
2. **middle** — `GridView` 横向三栏（`work.left` | `WorkStage` | `work.right`）；生成中仅中央
3. **bottom** — `WorkBottomBar` 状态条（可隐藏）

`WorkStage` = `work.center` 纵向网格：上 `nodes-container`、下 `subagent-details`。

## Services

无。数据在 locators / task-manager / studio-mode store。
