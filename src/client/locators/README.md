# locators — 导航上下文

## 职责
保存当前 `masId`、`unitKey`（分组单元）与 `taskKey`（一次运行 id），供 work 页各槽读取。

## 槽位
无 UI；`useLocators()` 供 React 组件订阅。

## 事件
- 写入：`mas.open`、`task.open`（task-manager.selectTask）
- 清空：`layout.boot`

## Services
无。

## 二期
预留 `orchestratorId`、`agentId`。
