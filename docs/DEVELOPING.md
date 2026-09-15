# pomasa-studio 开发者文档

这份文档面向在本仓库上开发的人。使用者请读仓库根 [README.md](../README.md)。

## 当前状态（2026-09-10）

- host 侧：分层模块 + 薄 `catalog.js` 转发 + `/pomasa` HTTP（`apply.js` 只注册路由）
- client 侧：boot 列表 + work 五区（task-tree / **工作流画布** / operation-controller + **节点 chat** / 产物底栏）；唯一入口仍是 dock → `shell.overlay`。见 [UI.md](./UI.md) 与模块 README（`src/client/`）。
- 删除操作：默认软删（注销 registry / 写 `.pomasa-hidden`，目录留盘）；`permanent: true` 硬删目录。
- 界面双语：中文/英文两套文案，设置面板切换，选择持久化到 `localStorage`（key `bandung-lang` / dock lang）。
- 新建 MAS 的 user input 隐含注入 STR-08（Pandoc-Ready Markdown）。见 [STR-08 模式](https://github.com/eXtremeProgramming-cn/pomasa/tree/main/skills/pomasa/pattern-catalog)。
- 数据契约由 [OBV-01/02/03](../../01.tools/pomasa/skills/pomasa/pattern-catalog/) 定义。

## 结构

```
src/client/         浏览器侧（esbuild 打包：scripts/bundle-client.mjs → lib/client.js）
  actions/          事件总线（规则：store 直调优先，bus 仅跨模块副作用通知）
  locators/         masId / unitKey / taskKey / agentKey
  layout/           boot / work 壳 + grid-view
  panel.js          workbench panel（shell.overlay 挂载、sidebar 对齐）
  session-driver.js dsh session 创建/追问/取消 + /pomasa/record 回写
  workspace-bootstrap.js  POMASA workspace 入账（重试）
  services/host-adapter.js  唯一宿主耦合层（ctx 探测、宿主 DOM、body class）
  task-manager/     轮询 store（client）
  task-tree/        左栏 unit→task 树
  dialogue/         确认 / 删除三按钮对话框
  ...
src/host/
  apply.js          入口：注册 /pomasa 路由
  http.js           JSON / query 工具
  paths/            pluginDir、pomasaHome、masDir、taskDir（唯一路径入口）
  file-system/      读写删 + file.change 事件
  logs/             插件目录 logs/host.log
  services/         后台事件总线（三期保留：file.change 推送通道，今无订阅方）
  session-registry.js  gen/run 会话 Map、/record、isAgentAlive
  workspace.js      POMASA workspace 入账
  catalog.js        HTTP → manager 薄转发（路由表驱动）
  MAS-manager/      mas list/get/delete（软/硬）、registry（单一写入者 store）
  MAS-creator/      mas.create、generation.*、prompt
  task-manager/     unit/task CRUD、unit.list/state（host）
  task-runner/      run.start、run.*
  agent-creator/    ctx.agents.create 预建 + standby seed（cwd=任务根）
  report-exporter/  docx 导出
  config/default-model.js  DSH settings.yaml 默认模型解析
  data/descriptor.js  pomasa.json 解析
  data/graph.js       工作流图 host 薄封装（fs 探测注入）
  core/skill.js       POMASA skill 快照（仅此）
  subagent-manager/   listDeclared / warmPrompt / listAlive / getInfo
  file-monitor/       fs.watch 基类（未挂接，三期保留）
src/runtime/
  bootstrap.js      ~/.pomasa 模板种子
  mcp-servers.js    MCP 配置读取
src/shared/
  graph.js          工作流图推导（host/client 共享，环境能力注入）
```

## 二期（2026-09-10 已实现）

- **中央画布**：`nodes-container` + `orchestrator/row` + `subagents/node` — 从 `pomasa.json` 推导一行 orchestrator + 阶段子代理，SVG 连线；节点三动作（蓝图 / 产物 / 对话）；`locators.agentKey` + `agent.chat.select`
- **运行前预热（三期）**：host [`agent-creator`](src/host/agent-creator/README.md) 在 `run.start` 预建编排器+子代理（cwd=任务根、seed 待机、setup 内 mount/composeFrom）；client 只对编排器 `followup(runPrompt)`
- **右栏 chat**：`work.right` 为可拖拽 `RegionGrid`（Run / Chat）；`chat/panel` 用 NativeConversationSeat 将宿主 ConversationRoot 视觉停靠进面板；`sessions.prompt` 发消息
- **新 HTTP**：`GET /pomasa/subagent.list`、`GET /pomasa/subagent.info`；`/record` 可选 `agentKey`（默认 `orchestrator`）；registry 扩展 `lastAgentSessionIds[unit|task][agentKey]`

## 三期路线（未实现）

- file-monitor 替代 task-manager 3s poll
- 画布多 orchestrator 纵向多行（数据模型已支持，fixture 仍单行）

## 验证

```bash
npm run build:client      # 重新生成 lib/client.js（若改动 src/client/*）
npm run verify            # L1 单元 + L2 host 集成 + client bundle 冒烟（无 DSH）
npm run test:pack         # 打包完整性：tarball 必带 skill/、lib/、pomasa-home/ 等（无 DSH）
npm run test:install      # L5：README 安装路径全链路（打包 → dsh plugin add → 真实 dsh web 启动断言）
npm run test:transport    # L3：封闭起的真实 dsh web + curl（不碰真实 profile）
npm run test:e2e:install  # 一次性装 @playwright/test + chromium
npm run test:e2e          # L4a：Playwright 浏览器 E2E（fixture 数据）
npm run hooks:install     # 一次性启用 pre-push 钩子（git config core.hooksPath .githooks）
```

分层测试方案见 [TESTING.md](./TESTING.md)。

## 安装链路 CI（L5）

`npm run test:install` 复现 README 的用户安装路径：把当前仓库 `npm pack` 成 tarball（`files` 白名单随之生效），在临时 `DSH_HOME` 里 `dsh plugin --profile web add <tarball>`，启动真实 dsh web，断言插件树加载、`/pomasa` 通道与 client bundle 正常。全程不碰真实 profile，临时目录退出即清。缺 `POMASA_INSTALL_SPEC` 时测本地包（即正被推送的代码）；设成 registry spec（如 `pomasa-studio@0.2.3`）时测已发布包（发版后验证 README 原样流程）。

pre-push 钩子（`.githooks/pre-push`）在每次 push 前依次跑 `npm run verify` 与 `npm run test:install`，作为本项目 CI。本机没有 dsh/pnpm 时 install smoke 自动跳过（`POMASA_SKIP_INSTALL=1` 可显式跳过）。

## 本地开发安装

```bash
dsh plugin --profile web add ~/Projects/03.systems/pomasa-studio
dsh web
```

改 client / host 后一键重建并重启 dsh（自动结束 3080–3099 上的旧进程）：

```bash
npm run debug              # build:client + 前台重启 dsh web
npm run debug -- --no-build   # 只重启，不打包
npm run debug -- --detach     # 后台重启，就绪后打印 URL 并退出
```

desktop profile 采用 pnpm link 方式安装（`link:~/Projects/03.systems/pomasa-studio`），改动即时生效，重启 profile 生效。移除插件时改 profile 的 `package.json`（dependencies 与 `dsh.profile.bundles`）后 `pnpm install`，再手工清掉 pnpm 不清理的 link 符号链接。

## 双语规范（改动 client 文案时必读）

- 文案不写在组件里，写到 [i18n.js](../src/client/i18n.js) 的 `I18N_ZH` / `I18N_EN`。
- 组件渲染时用 `t('key')`，需要重渲染的根组件挂 `useLang()`。
- 状态文本映射（`MAS_STATUS_TEXT`、`STAGE_STATUS_TEXT`）已改为返回函数，取值处要加调用括号。
- 表单默认值是 Studio 提供的文字，也进 i18n 字典，且"未被编辑的默认项"会跟随界面语言切换。
- 新增 client 模块直接 `import` 即可：esbuild 按 import 图打包（`React`/`ReactDOM`/`h` 为注入全局，无需 import）；verify 的 L2 渲染测试共用同一构建配置，被测符号从 `src/client/testing/exports.js` re-export。