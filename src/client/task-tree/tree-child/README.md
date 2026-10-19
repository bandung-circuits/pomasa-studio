# tree-child

## 职责
左栏树行 UI，与 [`tree.js`](../tree.js) 解耦：

- **UnitTreeChild**（add 原型）：unit 名 + 右侧 `+`（`task.new`）+ 子 task 列表
- **TaskTreeChild**（basic 原型）：task 名 + 状态徽章

右键 → `menu.open.tree.unit` / `menu.open.tree.task`；重命名菜单 → 行内 input → `unit.rename` / `task.rename`。

模块加载时向 [menu-service](../../menu-service/registry.js) 注册 tree 菜单。

## 槽位
由 `TaskTree` 按 kind 分组 map 渲染。

## 事件
发出：`task.new`、`task.open`（经 manager）、`menu.open.*`、`unit.rename` / `task.rename`、预改名 `*.rename.pre`

## Services
无。
