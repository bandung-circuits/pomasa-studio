# basic-title-area

## 职责

- **BootTitleBar**：BootSign + 设置 + **关闭 Studio**（`close` icon，最右侧）
- **WorkTitleBar**：返回列表 + MAS 名 + **模式切换**（`switch` icon，设置左侧）+ 设置 + **关闭 Studio**

新建 MAS 见 [`boot-toolbar`](../boot-toolbar/toolbar.js)。

模式切换打开 dialogue 风格 picker（portal 到 `#ps-overlay-root`），见 [`studio-mode/panel.js`](../studio-mode/panel.js)。
