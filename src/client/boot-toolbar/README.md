# boot-toolbar — Boot 页 VS 风格操作行

## 职责

Boot 页 **Recent 右侧** 操作区：分组标题「开始使用」+ 竖向宽行按钮（左图标 | 右标题 + 描述）。

## 注册

`registerToolbarAction({ toolbarId, id, order, icon, label, description, onClick })` — VS 宽行模式。

仍支持 legacy `{ render }` 自定义项。

默认 `toolbarId: 'boot'`：

| order | id | 描述 |
|-------|-----|------|
| 10 | `mas.create` | 新建 MAS → `mas.create` |
| 20 | `settings.open` | 设置 → `settings.open` |
| 30 | `studio.close` | 关闭 Studio → `closeWorkbenchPanel()` |

## 槽位

`boot.toolbar` region（frameless，位于 `boot.content` 右侧）。
