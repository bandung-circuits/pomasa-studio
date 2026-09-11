# dialogue

## 职责
模态对话队列：`confirmDialog`、`promptDialog`；`DialogueHost` 统一渲染。

## 槽位
无 UI 槽；`DialogueHost` 挂在 workbench 根 overlay。

## 事件
无 action 总线；各模块直接调用 `confirmDialog` / `promptDialog`。

## Services
无。
