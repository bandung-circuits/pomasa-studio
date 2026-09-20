# boot-tips — Boot 页 Footer 消息栏

## 职责

Boot 页底部轮播提示：POMASA 使用说明与 GitHub 仓库链接。

## 预设

[`tips.js`](tips.js) 维护 `BOOT_TIPS` 列表（`textKey` + 可选 `href`）。文案在 [`i18n.js`](../i18n.js) 的 `boot.tips.*`。

## 行为

- 单条显示，约 8s 自动切换下一条
- hover 暂停轮播
- 左右按钮手动切换（复用 `back` 图标）
- 带 `href` 的条目渲染为外链

## 槽位

`boot.footer` region（frameless），由 [`layout/boot.js`](../layout/boot.js) 渲染。
