# grid-view — 可拖拽网格

## 职责
`GridView`：横向 `row` / 纵向 `column` 分格、缝上拖拽、尺寸直写 configStore。
`RegionStack` / `RegionGrid`：按 region 渲染 parts（多 part 时自动 column 网格）。
`WorkStage`：中央列（`work.center`：上节点、下产物）。
`WorkRightStage`：右栏（`work.right`：Run control / Node chat，可纵向拖拽）。
`WorkBottomBar`：跨栏状态条（`work.bottom`，全空则不占位）。

## 尺寸持久化
`configStore._gridSizes` → `localStorage` key `pomasa-grid-sizes`（不进设置面板）。
默认按**当前可见 part 数量均等 flex 划分**（每项 `1`）；part 数量变化时忽略旧 persisted 尺寸并重新均分。
拖拽只调整 **flex 比例**，不在 cell 上设置 `maxHeight`/`maxWidth`；legacy px 持久化会自动迁移为 flex 权重。

## 事件
无（拖拽结果直调 `configStore.setGridSizes`，不经 bus）。

## Services
无。
