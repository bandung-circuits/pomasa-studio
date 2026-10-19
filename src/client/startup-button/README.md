UI + model

DSH 侧栏底部 `.hHd-Xa_footArea` 里有两个洞：
- `sidebar.footer.action`（list）：插件按钮，渲染进 `.hHd-Xa_footerActions`
- `sidebar.settings`（single）：原生 Settings 行

`data-slot="sidebar.footer.action"` 是槽位出口锚点（`display:contents`，不占布局）。本模块注册一项：图标 + 「POMASA」，盒模型对齐 Settings 的 `.VOzbGW_trigger`。
