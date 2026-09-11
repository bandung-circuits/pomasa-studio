# configs — 用户配置存储

## 职责
持久化用户可调项；一期仅桥接 `langStore`（界面语言）。

## 槽位
无 UI；由 `settings/panel.js` 读写。

## 事件
语言变更 → `configStore.setLang` → i18n 重渲染。

## Services
`localStorage`（经 i18n `bandung-lang`）。
