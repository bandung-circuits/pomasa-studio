# pomasa-studio 数据流设计（草案）

状态：v0.3（2026-08-28）。数据流设计定稿，六项设计决策全部确认，记录在第五节。

## 0. 目标与设计方法

目标：让任意 POMASA 生成的 MAS 可以被任意界面一致地展示和管理。当前以 DSH 插件形态出现（会话区 tab），远期抽离成独立"研究工作台"。

两条主原则：

1. 文件事实驱动。UI 的状态（阶段、产物、运行判定）都从 `~/.pomasa` 目录里的文件推导。运行时会话文本只在用户主动展开日志时才呈现，不参与状态推导。
2. 单边依赖。MAS（生成器、运行时、各 agent）负责产出描述符与运行记录；插件和 UI 只读与呈现；指令只能经会话通道注入。MAS 本身不依赖任何插件。

设计链条按你的要求推进：先定界面行为，从界面行为倒推数据接口，从数据接口倒推元数据规定与生成时机，再倒推 POMASA 需要增加的模式。

### 运行单元（v0.2 核心概念）

"一次运行"不是一个固定形状，它因 MAS 而异：

- 有的 MAS 刻在实体轴上（数字主权指数一次运行一个国家，属 BHV-03 并行执行场景）
- 有的刻在时间轴上（news-on-china 一次运行一个日期，属 BHV-07 累积场景）
- 有的根本没有运行轴，就整体跑一次（数据中心治理）

所以运行如何划分是 MAS 的设计决定，必须由元数据描述，不能由数据流写死。本设计把"运行"泛化为**运行单元**：每个单元是一份自包含的工作单位（单元根目录内含 run.json、阶段产物、output），单元键是物理含义名（国家、日期、混合键），而不是不透明的 run id。

## 1. 界面行为

### 1.1 页面与流转

工作台是分栏形态：左栏 MAS 导航（列表 + 新建/删除），右栏详情工作台（信息条、运行控制、阶段条、产物卡、查看器）；新建表单在右栏内。无整页路由。

渲染面（见 docs/UI.md「最终界面形态」）：唯一入口是左下角 `POMASA Studio` 按钮打开的 `shell.overlay` 有界面板（任意界面状态可达，会话内 tab 已移除）。流转：导航选 MAS → 右栏详情；新建 → 右栏表单，提交后回导航并进入该 MAS 详情。

### 1.2 页面 A：MAS 列表

行为：
- 从 `~/.pomasa/registry.json` 枚举 MAS，卡片展示：名称、一句话描述、运行统计（单元数、最后运行时间）、状态徽记（生成中、运行中、空闲、异常）。
- 动作：新建（进表单）、进入（进详情）、删除（二次确认，连带删除该 MAS 家目录）。
- 空态：引导文案加"新建第一个 MAS"按钮。
- 生成中的卡片：骨架屏加当前环节短语（如"正在设计 agent 结构"），附可折叠的会话日志面板（默认收起），展开即见生成会话的完整记录，含 AI 思考过程。

### 1.3 页面 B：新建 MAS 表单

- 字段 = user_input 模板，去掉输出格式部分：语言设置（蓝图语言、报告语言）、项目标识、研究主题与核心问题、初始想法、数据来源、参考资料（支持本地上传或 URL）、分析方法、报告格式与结构、质量等级、其它模式开关、其它要求。输出格式不选，统一为 Markdown，导出由查看器处理。
- 每字段可留空或写"由 AI 建议"，生成器兜底。
- 提交后立即回列表，该 MAS 以生成中状态呈现；可取消生成，失败可重试。

推导说明：表单字段就是 user_input，生成动作只有一个，把填好的 user_input 交给生成器会话。所以创建侧数据接口只有一个 `mas.create(input)`，其余都是文件事实。

### 1.4 页面 C：MAS 详情（核心页面）

顶部信息条：名称、描述、生成器与 schema 版本、创建时间、模式摘要、运行单元说明（单元轴是什么）。

运行控制区按 `work.mode` 分支：

- single：只有"运行"按钮，点一次跑整条流水线。
- multi：运行选择器 = 单元列表，每个单元一项，显示键名与状态（已枚举未运行、运行中、已完成、失败）；一次运行选择一个单元（人力逐单元启动，不批量并行）。若单元由运行期枚举，列表还包括"已枚举未运行"的提示，如已枚举 120 国，已运行 34。
- 时间轴 multi：运行选择器显示各日期单元，按钮为"跑新一期"（默认今天）。

主体三区：

1. 阶段条（横向）：每阶段一格，显示状态灯（等待、运行中、完成、失败、跳过），格角显示该阶段产物数量。点击某格选中该阶段。
2. 阶段产物区：该单元该阶段的产物卡片列表。卡片含：标题、副标题、概述、文件名、大小、产出时间、产出 agent。空态显示"该阶段尚未产出"。
3. 功能面板：选中产物后展示内容查看器（md 渲染、json 结构化、其它按文本），查看器顶部提供"导出 docx / pdf"动作，把当前 md 内容转换输出；运行中显示活动流（当前阶段、当前 agent、最近工具调用）；底部干预输入框向当前单元运行会话注入自由文本。功能面板另含可折叠的会话日志区（默认收起），展开显示完整会话记录，含 AI 思考过程，生成会话与运行会话同一处理。

运行信息栏：单元键、该单元的创建、启动、结束时间，状态，触发方式（按钮、外部），运行时会话标识。

状态判定规则（关键）：

- 阶段状态以单元根的 run.json 为权威。
- 兜底：run.json 缺失该阶段记录时，用该阶段 index.json 的存在性与文件时间推导。
- 产物数量读 index.json 条目数。
- 运行中判定：以 DSH 宿主 agent 注册表为权威（`ctx.get('agents').get(sessionId)?.status === 'running'`，与 apiserver 会话汇总同源）；run.json 停在 `running` 而 agent 已死 → 判定运行失败（`run-failed`），会话中断不再恒显"运行中"。
- 绝不读 orchestrator 的会话文本。

### 1.5 产物点击行为

内容查看器按类型分派：
1. `.md` 渲染（标题层级、表格、代码块、脚注）。
2. `.json` 结构化展示。
3. 其它类型按 UTF-8 文本。
非文本文件只显示文件名与大小，v1 不做预览。

## 2. 数据接口

接口的角色是薄翻译层：读请求映射到 `~/.pomasa` 的文件事实，写动作映射到运行时会话。接口自身不保存状态；registry.json 只是可推导的索引缓存。

### 2.1 接口清单

读：

| 接口 | 输入 | 输出 |
|---|---|---|
| `mas.list` | 无 | 注册表条目加快速状态 |
| `mas.get` | masId | pomasa.json 静态描述符（含 work 段） |
| `generation.status` | masId | generating、completed、failed + 当前环节短语 |
| `unit.list` | masId | 分组单元树：`{ key, kind, tasks: [{ id, status, run }] }`；`kind` 为 `date` / `country` / `default`；始终含 `default` |
| `unit.state` | masId, unitKey, taskKey | 任务根 run.json + 各阶段 index 概要 + 活动脉冲 |
| `artifact.read` | masId, unitKey, taskKey, relPath | 文件内容（防路径穿越；相对任务根） |
| `event.stream` | masId, unitKey, taskKey | 活动事件推送（WS、SSE、RPC），轮询兜底 |
| `generation.log` | masId | 生成会话完整记录（消息、工具调用、AI 思考过程），流式或翻页 |
| `run.log` | masId, unitKey, taskKey | 运行会话完整记录，同上 |

写：

| 接口 | 输入 | 效果 |
|---|---|---|
| `mas.create` | input（user_input 字段） | 建占位目录、起生成会话、返回 masId |
| `unit.add` | masId, key, kind | 新建分组单元目录并写入 `work.units`（`kind`: `date` / `country` / `default`） |
| `task.create` | masId, unit | 在指定单元下创建新任务目录，返回 `taskId`（`YYYYMMDD-HHmmss`） |
| `run.start` | masId, unit, task, opts | 对指定任务根启动一次运行；未传 task 则先创建；`fresh` 只清任务目录；重跑应 `task.create` 再 `run.start` |
| `run.intervene` | masId, unitKey, taskKey, message | 向该任务运行会话注入自由文本 |
| `run.cancel` | masId, unitKey, taskKey | 取消该任务运行会话 |

### 2.2 实现要点

- `artifact.read` 做路径白名单，解析后必须落在 masId、单元根目录内。
- `event.stream` 的实时源是运行时会话事件（DSH 下是 agent 事件流）；断线自动降级为轮询 run.json。
- `generation.log`、`run.log` 读运行时会话存储（DSH 的会话记录），不属于 `~/.pomasa` 的文件事实，属运行时绑定的追溯能力。无日志源（如未来非 DSH 运行时）时该面板自动隐藏，不影响其它功能。
- 研究工作台未来就是这个接口清单的独立实现，UI 端只依赖这些接口。

推导说明：此表逐行对应第一节的行为清单。左栏任务树对应 `unit.list`；选中任务后运行对应 `run.start(unit, task)`；重跑通过 `task.create` 新建目录，不覆盖旧 `run.json`。

## 3. 元数据规定与生成时机

### 3.1 文件布局（分组单元 + 任务运行）

```
~/.pomasa/
├── registry.json                 # MAS 索引（插件维护的缓存，逻辑上可推导）
├── skills/pomasa/<版本>/          # POMASA skill 加 OBV 模式快照，钉版本
└── <mas-id>/                     # MAS 家目录，自包含
    ├── pomasa.json               # 静态描述符（stages、contracts、work）
    ├── agents/                   # 蓝图，每个蓝图内含 Artifact 契约声明
    ├── references/               # 参考资料
    ├── units.json                # 可选：运行期枚举出的单元清单
    └── workspace/
        ├── default/              # 默认分组（原 single 模式、未归类任务）
        │   └── <task-id>/        # 一次完整流水线运行
        │       ├── run.json      # 该次运行记录（动态状态机）
        │       └── NN.<stage>/   # 各阶段产物目录，内含 index.json
        ├── brasil/               # kind=country 的分组单元（仅元数据，不进路径）
        │   ├── 20260909-131415/
        │   └── 20260909-140000/  # 重跑 = 新 task 目录
        └── 2026-09-09/           # kind=date 的分组单元
            └── 131415/
```

关键：
- **unit** = 分组文件夹（类别）；**task** = 一次完整流水线运行。路径为 `workspace/{unit}/{taskId}/`。
- `run.json` 与阶段产物均在 **任务根**（`workspace/{unit}/{taskId}/`），不在 unit 根。
- `work.units` 为 `{ key, kind }[]`（`kind`: `date` | `country` | `default`）；旧字符串数组读成 `kind: country`。
- 旧盘只读兼容（不搬文件）：`workspace/run.json` → 虚拟 `default/legacy`；`workspace/{unit}/run.json` 且无子 task → `{unit}/legacy`。
- 新运行一律写 `workspace/{unit}/{taskId}/`。

### 3.2 静态描述符 pomasa.json

生成时一次写出，此后只随蓝图变更而重算。work 段描述运行单元规划。

```json
{
  "schema_version": "obv-1",
  "pomasa_version": "1.0",
  "id": "sos-digital-index",
  "name": "Digital Sovereignty Index Assessment",
  "description": "按国家评估数字主权指数",
  "created_at": 1758000000000,
  "generator": "pomasa-generator-obv-1",
  "patterns": [
    { "id": "COR-01", "name": "Prompt-Defined Agent", "necessity": "required" },
    { "id": "BHV-03", "name": "Parallel Instance Execution", "necessity": "recommended" }
  ],
  "work": {
    "mode": "multi",
    "dimensions": ["country"],
    "units": null,
    "units_index": "units.json",
    "unit_layout": "workspace/{country}"
  },
  "stages": [
    {
      "index": 1,
      "id": "country_enum",
      "title": "Country Enumerator",
      "agent_file": "agents/01.country_enum.md",
      "kind": "stage",
      "contracts": []
    },
    {
      "index": 2,
      "id": "deep_research",
      "title": "Deep Researcher",
      "agent_file": "agents/02.deep_researcher.md",
      "kind": "stage",
      "contracts": [
        {
          "id": "assessment",
          "title": "Country Assessment",
          "shape": "single-file",
          "format": "markdown",
          "path_glob": "02.deep_research/assessment.md",
          "index_path": "02.deep_research/index.json",
          "schema": ["id", "title", "summary", "file"]
        }
      ]
    }
  ]
}
```

work 段字段：

- `mode`：`single` 或 `multi`。
- `dimensions`：单元键的物理意义，如 `["country"]`、`["date"]`。多注重按维嵌套，`["country", "year"]` 对应 `workspace/{country}/{year}/`。
- `units`：预声明分组单元列表。元素为 `{ key, kind }` 或旧式字符串（读成 `kind: country`）；`null` 表示运行期枚举。始终存在逻辑分组 `default`。
- `units_index`：运行期枚举结果写出的文件路径（相对 MAS 家目录），由 orchestrator 的枚举阶段（如 country_enum）写入。
- `unit_layout`：单元目录的 glob 模板，UI 靠它列出单元。

single 模式的 work 段是最简形：

```json
"work": { "mode": "single" }
```

要点：
- `index=0` 通常是 orchestrator，kind 为 orchestrator，无契约。
- 契约是产出形状的定义，与具体单元无关，路径一律相对单元根。
- 生成时机：生成器写完 agents/ 后，聚合蓝图里的 Artifact 声明写成 pomasa.json。蓝图声明是唯一权威源，pomasa.json 是它的聚合副本。

### 3.3 契约形状（沿用并正式化四个已验证形状）

| shape | 用途 | 实例来源 |
|---|---|---|
| vertical-list | 同类条目持续增长（如分析案例） | 阶段 index.json |
| horizontal-versions | 同一对象的多版本（如稿件草稿） | 阶段 index.json |
| multi-file | 通用回退（若干松散 md） | 阶段 index.json（可选） |
| single-file | 单个文档（常为交付物） | 阶段 index.json（单条） |

契约的 `path_glob`、`index_path` 相对 **任务根**。UI 解析基址为 `workspace/{unit}/{taskId}/`；旧盘 legacy 任务仍相对其虚拟任务根。

### 3.4 阶段实例切片 index.json（动态）

产出该阶段的 agent 在写完产物时同步写或更新。这是"每个产物的元数据表述"的载体。

```json
[
  {
    "id": "case-001",
    "title": "Meta Llama",
    "subtitle": "开源模型基础与治理现状",
    "summary": "该案例的发现综述",
    "file": "case-001-meta.md",
    "size": 48232,
    "created_at": 1758000000000,
    "producer": "deep_researcher"
  }
]
```

兼容 `{ "version": 1, "entries": [...] }` 形式。file 相对 index.json 所在目录解析。

规则：id、title、file 必填；subtitle、summary、size、created_at、producer 建议。后五项缺失不阻塞展示，校验不强制。

### 3.5 运行记录 run.json（动态，任务级状态机）

由 orchestrator 在阶段边界增量更新：任务运行开始时写初始骨架，阶段进入、完成、失败时更新对应条目，任务运行结束封口。位于 `workspace/{unit}/{taskId}/run.json`。

```json
{
  "schema_version": "obv-1",
  "mas_id": "sos-digital-index",
  "unit": "brasil",
  "created_at": 1758000000000,
  "status": "running",
  "trigger": "ui",
  "runtime": "dsh",
  "runtime_session_id": "sess-123",
  "stages": [
    {
      "index": 2,
      "id": "deep_research",
      "status": "active",
      "started_at": 1758000001000,
      "finished_at": null
    }
  ]
}
```

要点：
- run.json 只存状态机，不复制 index 条目，避免两处都写的双源问题。产物枚举以各阶段 index.json 为准。
- 生成时机：运行期由 orchestrator 维护，不是生成期。
- 兜底：DSH 宿主下，插件观察会话事件，若 run.json 未及时出现，可降级由插件补写。此兜底不作主机制，其余运行时没有此兜底也正常。

### 3.6 数据流汇总

生成时（每个 MAS 一次）：

```
user_input
  -> 生成器会话（POMASA skill 加 OBV 模式）
  -> agents/（含契约声明） + references/ + pomasa.json（含 work 段）
  -> 插件校验契约完整性
  -> 写 registry.json
```

运行时（每个单元）：

```
run.start（指定 unit + task；未传 task 则 task.create）
  -> 运行会话（orchestrator 蓝图），cwd = 任务根
  -> 需要枚举时，枚举阶段写 units.json
  -> 阶段 agent 写产物并更新 index.json
  -> orchestrator 在阶段边界更新 run.json
  -> 插件 watch ~/.pomasa/<id>/ 刷新 UI
  -> 活动层订阅会话事件
重跑：task.create（新 taskId 目录）再 run.start，不覆盖旧 run.json
```

展示时（每次刷新）：

```
详情页 = mas.get（静态）+ unit.state(unit, task)（动态）
work 段定位分组单元，task 定位一次运行；契约定容器、index 定实例、文件定内容
```

### 3.7 一致性校验（插件健康检查）

- 蓝图 Artifact 声明的 id 集合与 pomasa.json 汇总的契约 id 集合一致，否则提示描述符过期（提醒重算）。
- 生成完成时校验：必选文件齐备，pomasa.json 可解析，stages 与 agents/ 文件序列对应，work 段与列出的单元目录一致。
- 运行中：run.json 阶段状态与 index.json 的修改时间不矛盾（阶段标 completed 但 index 为空允许，但提示）。
- units.json 枚举出的单元若未建目录、无 run.json，不算异常，属于"已规划未运行"状态。

推导说明：第二节的全部读接口，返回数据都来自这些文件（pomasa.json、run.json、index.json、units.json）加文件本体。元数据文件总共四个，外加每 **任务** 一份 run.json。

## 4. POMASA 新增模式提案

新增分类 OBV（Observability，可观测性），三条必选模式：

**OBV-01 Observable Artifact Contract（可观测产物契约）**
- 内容：每个 agent 蓝图声明其产出为契约（shape、format、path_glob、index_path、schema，路径相对单元根）；产出该阶段的 agent 写 index.json；生成器聚合契约进 pomasa.json。
- 正文包含 3.3、3.4 的完整约定。
- 必要性：Required。

**OBV-02 Work Unit Declaration（运行单元声明）**
- 内容：运行按什么研究对象轴组织成 **分组单元**（unit），由描述符 work 段声明（mode、dimensions、units、units_index、unit_layout）。一次完整流水线运行是 **task**，目录为 `workspace/{unit}/{taskId}/`；重跑新建 task，不覆盖旧目录。single 模式任务落在 `default` 分组。
- 正文包含 3.1、3.2 work 段的 schema 与时机。
- 必要性：Required。

**OBV-03 Run Manifest（运行清单）**
- 内容：任务根内写 run.json 状态机，orchestrator 在阶段边界维护；任务目录自包含（阶段目录）。
- 正文包含 3.5 的 schema 与时机。
- 必要性：Required。

配套变更：
- pattern-catalog/README.md 增加 OBV 分类与索引。
- SKILL.md 生成指令提及三模式为必选，要求生成器产出 pomasa.json 与蓝图契约声明，并在生成 prompt 中引导用户回答运行单元规划（一次跑完，还是按国、按日期拆，拆哪些单元）。
- 模式正文里的元数据 schema 标版本（obv-1）。

本轮不新增：干预通道（GUI 结构化指令与自由对话的双通道纪律，后续随 BHV 模式出）、事件流细化、契约演示组件库、单元生命周期（保留策略，如只留最近 N 期）、BHV-08 wiki 整合（结构偏复杂，Studio 创建时不提供该选项，以普通阶段产物替代知识库需求）。

## 5. 设计决策（2026-08-28 定稿）

1. 运行单元模型：run 不再有强制 run-id 层，改为 work 段声明（single / multi + dimensions），单元目录键用含义名（国家、日期）。跨单元汇总需求当前不存在，不预建机制。
2. 不设 output 目录：最终报告就是末阶段普通产物（如 05.report/final_report.md），docx / pdf 导出是查看器功能，MAS 不产出交付格式文件；user_input 里的"交付物格式"整块从新建表单去掉，输出统一为 Markdown。
3. run.json 只存状态机，不复制产物条目，产物以各阶段 index.json 为准。
4. index.json 由阶段 agent 写，run.json 由 orchestrator 写，插件不代写（仅降级兜底）。OBV 三模式均为必选是此条成立的前提。
5. 新建表单用 user_input 全量字段（去掉输出格式），留空项由生成器兜底"由 AI 建议"。wiki（BHV-08）不提供。
6. 会话日志可折叠展开，生成与运行会话同一处理，默认收起，展开含 AI 思考过程（如运行时提供）；日志是追溯面板，不参与状态推导。
7. （2026-08-29）DSH 集成形态：Studio 拆成左导航右详情的分栏工作台；**唯一入口是左下角 `POMASA Studio` 按钮打开的 `shell.overlay` 有界面板**（不遮挡、任意界面状态可达，含 DSH 0.1 不渲染 tab 条的空白会话）。会话内的 `conversation.view` tab 已移除；全屏覆盖层（旧 `.ps-app-overlay`）废弃。详见 docs/UI.md「DSH 平台要点」。
8. （2026-08-29）会话与状态模型：每个 MAS 同一时刻只关联一个活会话。**一次 `run.start` = 对一个 task 的一次运行，永远人手发起，绝不批量或自动续跑**（传多个 unit 直接拒绝；客户端"运行"按钮只运行当前选中 task）。MAS 状态由会话生命周期 + 文件事实推导，共六态：`generating` / `gen-failed` / `idle` / `running` / `run-failed` / `completed`。死会话判定：以 **DSH 宿主 agent 注册表**为权威。运行标识：unit + taskId；**重跑 = 新 task 目录**，不覆盖旧 run.json。registry 中 `lastRunSessionIds` 键为 `{unit}|{task}`。
9. （2026-08-29）DSH 会话↔工作区入账（平台缺口，实证结论）：会话是否显示在某工作区文件夹下，取决于创建时是否"入账"——只有经工作区流程创建（`sessions.create` 带 workspaceId，内部调 `workspace.attachSession`）的会话才入账。插件的生成/运行会话由宿主 `agents.create` 创建（只带 cwd，不带 workspaceId），DSH 拒绝补挂：`insertSessionBefore` 只对已入账会话排序；宿主插件上下文拿不到 `ctx.workspaceRegistry`（全 profile 实测为 null）；客户端无 attachSession RPC；`agents.create` 拒绝认领已存在会话（"session already exists"）。结论：**在当前 DSH 插件 API 下，插件创建的 agent 会话无法归入工作区**（只能停留在"未分组"），工作区文件夹本身可由客户端创建。修复需 harness 侧支持（如给 `agents.create` 加 workspaceId，或把 workspace.attachSession 暴露给插件）。
10. （2026-08-29）生成会话仍由客户端经 POMASA 工作区入账（`connectWorkspace` + `sessions.prompt` + `/record`）。
11. （2026-09-10）**运行会话改 host 预建**（决策 9 的 cwd 约束下）：`run.start` 调用 `ctx.agents.create` 在**任务根** cwd 预建编排器与子代理（standby seed，零 LLM）；`setup` 内 `agentPresets.mount` / 子代理 `composeFrom`（与 Web `session.create` 一致，否则无 tools、DSML 泄漏）。`workspace.attachSession` 挂到**任务目录 workspace**。client 仅 `followup` 编排器 sid；已跑坏旧 task 用 New task & run。生成 MAS 仍走 client 入账 POMASA（决策 10）。
11. （2026-09-09）界面形态：旧「左导航 MAS 列表 + 右详情页」由 **boot 列表页 + work 五区页** 替代（见 docs/UI.md）。文件事实驱动、状态推导、单 task 运行纪律不变；一期中心为只读阶段条，画布连线与右栏 chat 留二期。
12. （2026-09-09）Unit 分组 + Task 运行树（已落地）：unit 仅为分组文件夹（`default` / 时间 / 国家）；task 才是一次运行。磁盘 `workspace/{unit}/{taskId}/`；左栏按 kind 三段展示 unit→task 树；`unit.add` / `task.create`；旧 `workspace/run.json` 与 `workspace/{unit}/run.json` 只读映射为 legacy task。

## 附录 A：生成端到端测试结论（2026-08-28）

用全新模型子代理（只读 SKILL.md 与模式目录，不掺任何 OBV 提示）生成 llm_south 研究 MAS，验证"模式驱动生成"成立。测试环境 /tmp/pomasa-gen-e2e/，结果：

- 9/9 Required 模式全采纳，含 OBV 三条。
- pomasa.json 合法，schema_version obv-1，work {mode: single}，8 阶段各带契约，契约路径相对单元根。
- orchestrator 蓝图内嵌 run.json 维护协议（初始写入、每阶段边界 completed 加时间戳、收尾封口）；9 份蓝图全部维护 index.json。
- README 含 Built with POMASA 溯源块。

实现前注意事项：

1. 契约 id 键名：生成器产出 pomasa.json 时用 `artifact` 字段镜像蓝图 Artifact 标签（DESIGN 3.2 示例写的是 `id`）。实现读取端两个都接受，或以 `artifact` 为准。
2. 交付格式：user_input 不声明"仅 Markdown"时，生成器会照常采纳 STR-09 并产出 _output/ 与导出管线。Studio 的 mas.create 生成 user_input 时必须写死交付格式 = markdown，否则生成的 MAS 自带 Studio 已声明不需要的导出管线。