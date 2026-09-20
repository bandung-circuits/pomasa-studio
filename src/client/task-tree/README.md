# task-tree

## 职责
左栏 unit→task 树容器。unit 即文件夹，**平铺**列出（`default` 回落 unit 置顶），不再按 date/country/other 分段。

- **只渲染 + 刷新** [`tree-child`](tree-child/child.js) 行；数据来自 task-manager 轮询
- Part 标题栏右侧 **`+`** → `unit.prompt` → dialogue 输入 unit 名 → `unit.new`
- 无顶部表单、无底部 New task 按钮

## 槽位
work 页左栏（`PartFrame` + `registerTitleAction` 标题 `+`）。

## 事件
发出：`unit.prompt`（标题 +）、`run.choose` / `run.start`（双击 task 或右栏）

## Services
无（经 actionBus → task-manager / menu-service）。
