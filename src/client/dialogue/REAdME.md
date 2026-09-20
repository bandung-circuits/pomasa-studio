# dialogue

## 职责
模态对话队列：`confirmDialog`、`promptDialog`、`deleteDialog`；`DialogueHost` 统一渲染。

## 槽位
无 UI 槽；`DialogueHost` 挂在 workbench 根，backdrop **portal 到 `#ps-overlay-root`**（z=109+），避免被 ConversationRoot dock（z=21）挡住。

## 事件
无 action 总线；各模块直接调用 `confirmDialog` / `promptDialog` / `deleteDialog`。

## Services
无。
