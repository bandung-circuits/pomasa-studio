# 发版前打包检查记录

日期：2026-09-17  
版本：`pomasa-studio@0.2.4`  
范围：本地验证 + Desktop/Windows 可行性分析。**未执行 `npm publish`。**

## 1. 执行结果摘要

| 检查项 | 命令 / 方式 | 结果 |
|--------|-------------|------|
| Client 构建 | `npm run build:client` | OK — `lib/client.js` 384147 bytes |
| 单元 + 集成 | `npm run verify` | OK — **38 passed, 0 failed** |
| Tarball 完整性 | `npm run test:pack` | OK — 199 entries，`skill/`、`lib/`、`pomasa-home/` 均在包内 |
| Dry-run 清单 | `npm pack --dry-run` | OK — 与 `package.json` `files` 白名单一致 |
| README 安装链路（目录） | `npm run test:install` | OK — 临时 `DSH_HOME`，`dsh plugin --profile web add <repo>` |
| README 安装链路（tarball） | 手工 `dsh plugin --profile web add *.tgz` + 起 web | OK — `/pomasa/mas.list` → `{"ok":true,"mas":[]}`；`/plugins/pomasa-studio/client.js` 可访问 |
| Desktop profile 安装 | 临时 `DSH_HOME`，`dsh plugin --profile desktop add *.tgz` | OK — `skill/SKILL.md`、`lib/client.js` 存在；bundles 含 `pomasa-studio` |

## 2. README 安装路径对照

README 声明：

```bash
dsh plugin --profile <profile> add pomasa-studio
```

| 场景 | 是否可行 | 说明 |
|------|----------|------|
| 已发布到 npm 后 | 是 | 与 README 完全一致；发版后用 `POMASA_INSTALL_SPEC=pomasa-studio npm run test:install` 复验 |
| 发版前本地代码 | 否（包名） | npm 上尚无 `0.2.4` 时无法用包名装当前树 |
| 发版前最接近预检 | 是 | `npm pack` → `dsh plugin --profile web add ./pomasa-studio-0.2.4.tgz`（本次已通过） |
| 开发者本地 link | 是 | `dsh plugin --profile web add <repo路径>`（`test:install` 默认路径） |

**脚本与文档差距：**

- [`scripts/install-smoke.sh`](../scripts/install-smoke.sh) 默认 **add 本地目录**，不是 tarball；[`docs/DEVELOPING.md`](DEVELOPING.md) 写的是 pack 再 add。
- 建议发版前人工跑一次 tarball 路径（本次已跑）；可选后续把 install-smoke 默认改为 pack→add，与 DEVELOPING 对齐（本次未改脚本）。

**支持 profile：**

- `web` — 已验证（L5 + tarball）
- `desktop` — tarball 安装与 bundle 注册 OK；**未在本机启动 DSH Desktop 二进制做 UI 断言**（见 §4）

## 3. `/pomasa` HTTP 接口清单

基址：`/pomasa`（[`src/host/http.js`](../src/host/http.js) `API_BASE`）。Client 统一经 [`src/client/api.js`](../src/client/api.js) 或相对 `fetch('/pomasa/...')` 调用。

### GET

| 路径 | 用途 |
|------|------|
| `/pomasa/mas.list` | MAS 列表 |
| `/pomasa/meta` | 首页路径、会话 id、host 平台信息 |
| `/pomasa/mas.get?masId=` | 单个 MAS 描述符 |
| `/pomasa/generation.status?masId=` | 生成状态 |
| `/pomasa/unit.list?masId=` | 单元列表 |
| `/pomasa/unit.state?masId=&unit=&task=` | 单元/任务运行态与产物索引 |
| `/pomasa/artifact.read?masId=&unit=&task=&path=` | 读产物（`head=1` 仅标题） |
| `/pomasa/blueprint.read?masId=&path=&stage=` | 读蓝图 |
| `/pomasa/run.log?masId=&unit=&task=` | 运行日志 |
| `/pomasa/generation.log?masId=` | 生成日志 |
| `/pomasa/subagent.list?masId=&unit=&task=` | 声明的子代理 + alive 状态 |
| `/pomasa/subagent.info?masId=&agentKey=&unit=&task=` | 单 agent 会话信息 |
| `/pomasa/agent.log?masId=&agentKey=&unit=&task=` | Agent 日志 |
| `/pomasa/events?masId=` | SSE 文件变更推送 |
| `/pomasa/meme.jpg` | 静态 meme 图（替代 WebView 禁用的 data: URI） |

### POST

| 路径 | 用途 |
|------|------|
| `/pomasa/mas.create` | 新建 MAS |
| `/pomasa/mas.delete` | 删除 MAS（软/硬） |
| `/pomasa/run.start` | 启动运行 |
| `/pomasa/run.intervene` | 运行中干预 |
| `/pomasa/run.cancel` | 取消运行 |
| `/pomasa/design.start` | 设计模式 agent |
| `/pomasa/record` | 登记 sessionId |
| `/pomasa/export` | Markdown → docx |
| `/pomasa/unit.add` / `unit.rename` / `unit.remove` | 单元 CRUD |
| `/pomasa/task.create` / `task.rename` / `task.remove` | 任务 CRUD |
| `/pomasa/fs.reveal` | 在文件管理器中Reveal |
| `/pomasa/diag` | Client 诊断写入 `~/.pomasa/diag.jsonl` |

### Host 注入依赖（[`src/host/apply.js`](../src/host/apply.js)）

`webServer`, `agentLoop`, `tools`, `agents`, `agentPresets`

### Client 注入依赖（[`src/client/main.js`](../src/client/main.js)）

`slots`, `workspaces`, `sessions`

### Client 槽位（DSH slots）

| 槽位 | 模块 | 用途 |
|------|------|------|
| `sidebar.footer.action` | `startup-button/button.js` | 左下角 POMASA 入口按钮 |
| `shell.overlay` | `panel.js` | 工作台面板（boot/work UI） |

### Client 宿主 DOM 探测（ fragile ）

| 选择器 | 用途 |
|--------|------|
| `[data-conversation-scroll]` | ConversationRoot 定位（chat dock） |
| `[class*="sidebarCol"]` | 侧栏宽度对齐（hash class，换壳易失效） |

## 4. DSH Desktop / App 端适配

### 本机探测（2026-09-17）

- CLI：`dsh --version` → **0.1.0-rc.6**（Harness CLI；README 写的 **DSH Desktop 0.7.2** 指桌面应用发行版，二者版本号体系不同）
- 用户 `~/.dsh/profiles/` 存在 **`web`** 与 **`desktop`** 两个 profile
- `desktop` profile 已声明 `pomasa-studio` bundle（用户环境为 `^0.2.5`）
- 临时 `DSH_HOME` 下 `dsh plugin --profile desktop add <tarball>`：**安装成功**
- 已安装包 `dsh.client.platform` 仍为 **`web`**（[`package.json`](../package.json)）；Desktop 通常仍是 WebView + web client，**未发现 Desktop 因 platform 字段拒绝加载 client 的证据**

### 文档与代码漂移

| 来源 | 入口描述 |
|------|----------|
| README | 左下角 POMASA Studio 按钮 |
| [`docs/UI.md`](UI.md) §仍保留 | 「入口在 `dsh-app-dock`」 |
| 现码 | `sidebar.footer.action` + `shell.overlay` |
| 用户 web profile bundles | 含 `dsh-app-dock`（与 footer 槽位并存，非互斥） |

### App 端结论

- **Host 层**：Node 插件，随 DSH profile 加载；desktop/web 共用同一 `/pomasa` 路由 — **适配成本低**
- **Client 层**：依赖 web slots + 相对 URL + 宿主 React 注入 — **Desktop WebView 理论上可行**，但需实机验证：
  - 入口按钮是否出现在 `sidebar.footer.action`
  - `shell.overlay` 面板布局与侧栏对齐（`sidebarCol` hash）
  - ConversationRoot dock 与 chat 面板
- **本次缺口**：未启动 DSH Desktop.app 做 UI/E2E；发版前建议在 DSH Desktop 0.7.2 实机点一次入口 + 新建 MAS  smoke

## 5. Windows 跨平台可行性

### 已有处理

| 区域 | 实现 | 风险 |
|------|------|------|
| `skill/` 路径 | [`paths/index.js`](../src/host/paths/index.js) 用 `fileURLToPath`，避免 `URL.pathname` → `C:\C:\...` | 低（2026-09 已修） |
| Tarball 含 `skill/` | `test:pack` + install-smoke 断言 | 低 |
| 数据目录 | `~/.pomasa` → `%USERPROFILE%\.pomasa` via `os.homedir()` | 低 |
| 路径拼接 | 统一 `path.join` / `path.sep` | 低 |
| Reveal 文件 | [`reveal.js`](../src/host/file-system/reveal.js) `explorer /select,...` | 低–中（explorer 退出码、空格路径） |
| 平台元信息 | `GET /pomasa/meta` → `host.platform`, `fileManager` | — |
| Meme 图 | `/pomasa/meme.jpg` 静态路由（非 data: URI） | 低（Desktop WebView 限制） |

### 风险区

| 区域 | 难度 | 说明 |
|------|------|------|
| 安装/CI 脚本 | **中–高** | `test:pack`、`test:install`、`test:transport` 为 **bash**；Windows cmd 不能直接跑；需 Git Bash / WSL / CI Windows runner |
| `fs.watch` + SSE | **中** | Windows 递归 watch 可用但易丢事件；已有 poll 降级（[`file-monitor`](../src/host/file-monitor/README.md)） |
| Desktop WebView | **中–高** | 需 Windows 实机验证 slots、同源 `/pomasa`、SSE |
| Windows CI | **高** | 仓库无 Windows runner；完整覆盖需实机或新增 workflow |
| Harness 版本 | **中** | README 锁定 DSH Desktop 0.7.2；Windows 用户 dsh/Harness 版本不一致时 API 可能漂移 |

### 总体判断

- **npm 发版 + web profile（macOS/Linux）**：**可行** — 本次打包与安装链路已通过
- **Windows web profile**：**host 层大体可移植**；主要工作量在 **bash 脚本 / 实机 UI / Desktop WebView**，非核心业务逻辑
- **发版后建议**：`npm publish` → `POMASA_INSTALL_SPEC=pomasa-studio@0.2.4 npm run test:install`；Windows 实机跑一次 `dsh plugin add` + 打开工作台

## 6. 发版 checklist（未执行 publish）

- [x] `npm run build:client`
- [x] `npm run verify`
- [x] `npm run test:pack`
- [x] `npm run test:install`（本地目录）
- [x] tarball → `dsh plugin add` → web 启动断言
- [x] desktop profile tarball 安装断言
- [ ] `npm publish`（刻意跳过）
- [ ] 发版后 registry install smoke（`POMASA_INSTALL_SPEC=pomasa-studio@0.2.4`）
- [ ] DSH Desktop 0.7.2 实机 UI smoke（Windows + macOS 各一次，建议）
