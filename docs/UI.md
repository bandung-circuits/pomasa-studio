# pomasa-studio UI 选型

状态：2026-08-28 定。

## 结论

不引入第三方 UI 库作为运行时依赖。组件全部自写，样式 token 全部用 DSH 主机的 `--dsw-alias-*` CSS 变量，视觉按 Geist 比例、shadcn 结构。构建保持简单拼接，不引 esbuild。

## 决定性约束

DSH client 槽位规范（`deepseek-harness/packages/extensions/cordis-client-runner/src/client/slot-catalog.ts`）原文："You cannot `import` anything, so the design-system components are out of reach: build markup with `React.createElement` and ship CSS through `styles.insert(css)`. Use the theme CSS variables (`var(--dsw-alias-bg-layer-1)`, `var(--dsw-alias-label-primary)`, …) instead of literal colors"。

由此：

- 第三方库只能"构建时 inline 打进 client.js"一条路，运行时模块注册表里只有宿主提供的东西。
- 库自带的设计系统（MUI theme、AntD token、Mantine Provider）与 DSW token 体系互相独立。不打通就双主题维护，打通等于重写它的主题适配层。

## 候选考察（2026-08 状态）

| 候选 | 结论 | 理由 |
|---|---|---|
| Ant Design / MUI | 否 | 400KB+ 量级，自带主题体系，与 DSW token 双轨维护；研究工作台未来可换完整技术栈，插件期不应背上迁移税 |
| Mantine | 否 | 同类组件库中包体最大，自带 Provider 主题系统，同上 |
| shadcn/ui | 否（取其精神） | 不是运行时库，是 Tailwind + 贴片组件；Tailwind 与"样式注入 + 宿主 token"模型冲突。其"组件源码归你"的哲学照搬：结构化组件自己写 |
| Radix primitives | 暂缓 | headless 的行为质量好，但 inline 打包加 __ModuleLoader__ 工厂格式适配有成本；本场景只需 dialog、collapsible、tabs 三四种简单部件，手写 a11y 边界可控。研究工作台若出现复杂控件（combobox、弹层）再引入不迟 |
| HeroUI / Chakra | 否 | 同 MUI 类，自带 theme 体系 |
| Geist（Vercel） | 借比例不借代码 | 大字号层级、单一强调色、疏朗留白，正是"研究工作台"观感的现成参照，把规则移植进自有 CSS |

## 组件规划（自写，全部用 token 变量）

PageHeader、Card、Button（primary / ghost）、Badge、StatusDot（等待/运行中/完成/失败/生成中）、EmptyState、Field（Input / Textarea / Select）、**WorkflowCanvas**（orchestrator 行 + 节点卡 + 连线）、ArtifactCard、ArtifactViewer（内嵌迷你 Markdown 渲染器，React 元素输出，杜绝 innerHTML XSS）、LogPanel（可折叠）、RunSelector、**AgentChatPanel**（节点对话 composer）。

## 视觉规则（写码强制）

1. 基准字号 16px；页标题 28px semibold、区块标题 20px semibold、卡片标题 16px medium；不做 14px 以下正文。
2. 行高 1.6 起步；卡片内边距 20px 起步；区块间距 28px 起步；内容最大宽度约 1024px 居中。
3. 圆角 12-16px；描边与背景层级全部用 `--dsw-alias-border-l2/l3`、`--dsw-alias-bg-layer-*`，明暗主题自动跟随。
4. 单一强调色 `--dsw-alias-brand-primary`（或 `state-business-primary`）；状态徽记用 `state-success/error/warn` 但降饱和。
5. 动效克制：hover 亮度过渡 150ms，无花哨入场。
6. 空态：几何图形 + 一句引导文案。
7. **CSS 以 JS 模板字面量注入，内部禁止出现反引号 `` ` ``**（会提前闭合模板，之后的样式静默全部丢失）；`verify.mjs` 有"恰好一对反引号 + 末条规则存在"的守卫。
8. 工作台树外直接挂在 DSH 宿主里，`.ps-root *` 的 box-sizing 重置不生效——工作台自身已加 `border-box` 子树重置；缺了它 `width:100% + padding` 会横向溢出（`margin-right` 变负，右侧被裁）。

## 已知 token（自 harness apps/web 枚举）

- 背景：`bg-base`、`bg-layer-1/2/3`、`bg-overlay`
- 描边：`border-l1/l2/l3/l4`
- 文字：`label-primary`、`label-dimmed`、`label-caption`、`label-primary-dimmed`
- 强调：`brand-primary`、`state-business-primary`
- 语义：`state-success-primary`、`state-error-primary`、`state-warn-primary`
- 按钮：`button-primary-fill`、`button-primary-hover`
- 交互：`interactive-bg-hover`

## 最终界面形态（2026-09-09 更新：boot + work 五区）

### 唯一入口：左下角「POMASA Studio」按钮 → `shell.overlay` 工作台面板

面板仍是有界的 `shell.overlay`（透空侧栏、不遮挡会话树）。内部由 **boot 页** 与 **work 页** 两套路由组成（`actions` 事件 `layout.boot` / `layout.work`）。

#### Boot 页（MAS 列表）
- 顶栏：品牌 + **新建 MAS** + 设置
- 内容：`MAS-list` 卡片网格；点卡片进入 work 页
- 新建：`MAS-creator` 二级 overlay 表单

#### Work 页（替代旧「左导航 + 右详情」）
- 顶栏：返回列表 + MAS 名称 + 设置
- **壳层**（纵向）：title → middle → bottom（状态条，默认可隐藏）
- **middle**（`grid-view` 横向三栏）：左 `task-tree` | 中央 **WorkStage** | 右 `operation-controller` + **`agent-chat`**
- **WorkStage**（中央列纵向网格）：上 `nodes-container`（**工作流画布**：orchestrator + 阶段节点、连线、三动作）| 下 `subagent-details`（按 `agentKey` 过滤产物卡）
- 生成中：middle 仅中央 WorkStage；`agent-processing-bar` 在 bottom 状态条
- 各 part 经 **PartFrame**（36px 标题 + 内容）；拖拽缝调整栏宽/中央上下比例，尺寸存 `localStorage`（不进设置）
- 点产物卡 → `file-reader` 弹窗查看

模块地图见 `src/client/*/README.md`；跨组件通信用 `actions` + `locators`（`masId` / `unitKey` / `taskKey` / `agentKey`）。

#### 仍保留的 DSH 约束
- 入口在 `dsh-app-dock`，非 `sidebar.footer.action`
- 会话内 `conversation.view` tab 已移除
- client 源码由 `scripts/bundle-client.mjs` 按依赖序拼接，不可 `import` 第三方 UI 库

### 工作台与输入区

面板有界盖在主内容区，composer 天然被面板盖住，无需隐藏规则。（早期为会话内 tab 加的 `[data-conversation-scroll]:has(.ps-workbench) > [data-composer-seat]{display:none}` 规则随 tab 移除而不再触发，保留无妨。）

### DSH 平台要点（踩坑记录，供后续开发）

- `shell.overlay` 层 z-index 20、`position:absolute;inset:0`、pointer-events:none，其直接子元素被强制 pointer-events:auto（`.pI_x6G_overlayLayer > *`）。要留透空区，必须 `pointer-events:none !important` 覆盖。
- workspaces 服务是快照仓库：`ctx.get('workspaces').list.getSnapshot().items`；`connectWorkspace(workspaceId)` 返回 reuse-or-create 的会话 id，随后 `ctx.get('sessions').open(id)`。`workspacesSvc.create` 入参是 `{ path }`（不是裸字符串，Workspace 构造会 `'workspaceId' in source`）。
- 会话有内容前 tab 条不可达；`dsh.conversation.chat.<sessionId>` 是 per-session chat store 的 localStorage persist 键，若想预置 view 必须填全 `{selection:null, draft:'', view, inspect:null}` 否则 composer 崩。
- e2e：DSH 0.1 冷环境启动弹两个顶层模态（Internal Testing Notice→Continue、Add an API key→Configure later），其 mask z-index 1000 冻结一切点击，helper 必须先关。

### 测试命令

```bash
npm run build:client   # 重拼接 lib/client.js（纯拼接，无 import）
npm run verify         # L1+L2：17 项
npm run test:transport # L3：真实 dsh web + curl
npm run test:e2e       # L4：Playwright（fixture 数据；已修 package.json 指向 e2e/playwright.config.ts）
```