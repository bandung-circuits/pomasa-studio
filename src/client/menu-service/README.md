# menu-service

## 职责
右键菜单注册表 + `MenuHost` UI。只负责展示与 **转发 action**，不实现业务。

## 注册
```js
menuService.register({
  id: 'tree.unit',
  openOn: 'menu.open.tree.unit',   // 每类菜单唯一 open action
  placement: 'anchor-end',         // 默认锚点右下；可选 pointer / anchor-start
  items: (payload) => [{ id, label, action, disabled?, danger?, payload? }],
})
```

## 槽位
`MenuHost` 挂在 workbench 根（与 `DialogueHost` 并列）。

## 事件
- 打开：`menu.open.*`（payload 含 `anchor` DOM、`clientX/Y`、上下文键）
- 选中条目：`emit(item.action, { ...payload, ...item.payload })`

## Services
无；订阅方（如 task-manager）处理 `unit.delete`、`task.rename` 等。
