# hierachy — UI 渲染层级

相对层级模型：每个窗口/浮层带 `base`（宿主累积偏移）+ `kind`（自身偏移量），形成 superset。

## 偏移量

| kind | offset |
|---|---|
| main | 0 |
| info | +1 |
| temporary | +5 |
| dialogue | +9 |
| secondary | +10 |

## 叠加规则

宿主通过 `HierarchyScope` 把自身 kind 偏移累加到 `base`，子级浮层读取 `useHierarchyBase()` 或 `snapshotHierarchyBase()` 作为 `hierarchyBase` 传入。

示例（主页面打开 secondary，secondary 标题栏点 zoom）：

| 层 | base | kind | z |
|---|---|---|---|
| secondary 窗口 | 0 | +10 | 110 |
| secondary 内 info tooltip | 10 | +1 | 111 |
| secondary 内 temporary | 10 | +5 | 115 |
| secondary 内 dialogue | 10 | +9 | 119 |

主 Part 内触发的 temporary 仍为 base=0 → z=105，低于 secondary。

## API（`stack.js`）

- `psHierarchyChildBase(kind, base)` → 累加偏移后的子 base
- `psHierarchyZ(kind, base)` → 数字 z（overlay 类 kind 有全局 floor 100 + base + offset）
- `psHierarchyProps(kind, base)` → `{ className: 'ps-hier', style: { zIndex, '--ps-z' } }`
- `psHierarchyBackdropProps(kind, base)` → 模态 backdrop
- `psHierarchyMainProps()` → 工作台 / Part 基底（含 `--ps-z-part`）
- `useHierarchyBase()` → React Context，当前 scope 累积 base
- `snapshotHierarchyBase()` → 同步读取栈顶 base（dialogue / menu 入队时用）
- `HierarchyScope({ kind, base?, children })` → 为子树提供叠加 base
- `psOverlayRoot()` → `#ps-overlay-root`（`temporary-window` / info tooltip portal 挂载点）

浮层必须 portal 到 `#ps-overlay-root`，否则会被相邻 grid part 的 stacking context 遮挡。
