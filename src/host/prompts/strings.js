const ZH = {
  'prompt.reply': '请使用中文思考与回复（本 MAS 的蓝图语言为中文）。',
  'warm.orch.user': `{{reply}}
你是本 MAS 的编排者（Orchestrator）待机实例。请先阅读蓝图：{{blueprint}}

当前任务单元根（运行沙箱）：{{unitRoot}}
请保持待机，等待研究者启动运行或发出指令后再按蓝图编排各阶段。不要自行开始阶段工作或写产物。`,
  'warm.orch.assistant': '已就位。我已阅读待机指示，将保持待机，等待运行指令后再按蓝图编排各阶段。',
  'warm.stage.user': `{{reply}}
你是阶段子代理「{{title}}」（{{key}}）的待机实例。请先阅读蓝图：{{blueprint}}

当前任务单元根：{{unitRoot}}
请保持待机，等待编排者（Orchestrator）调度后再执行本阶段任务。不要自行开始工作或在单元根外写入文件。`,
  'warm.stage.assistant': '已就位。我是阶段子代理「{{title}}」，将保持待机，等待编排者调度。',
  'run.fresh': '本次运行从干净单元根开始：不要保留、不要沿用上轮产物，按蓝图全新执行。',
  'run.continue': '本次运行基于既有成果继续：保留单元根内已有产物，不要清空。严格按照研究者的指令决定保留、改写或删除哪些产物。研究者指令：{{instruction}}',
  'run.continue.empty': '（无额外指令，在既有成果基础上正常推进）',
  'run.body': `{{reply}}
你是本 MAS 的编排者（Orchestrator）。本次运行单元：{{unitKey}}。

请打开 {{orchBlueprint}}，严格按照该蓝图执行本次运行（按 OBV-03 协议创建并维护 {{runJson}}，按需调用各阶段子代理，各阶段按 OBV-01 维护其 index.json）。
{{continueNote}}
本次运行的单元根（运行沙箱）是：{{unitRoot}}
运行期所有文件写入、包括运行笔记，都必须放在单元根内；不要尝试写单元根之外的路径（如 MAS 根的 wip/）。会话的工作目录是 POMASA 工作区，不等于单元根；所有读写请以单元根的绝对路径为准。
{{protocol}}
不要提问，按流程执行。`,
  'run.protocol': `
## 子代理调度与等待（send_message）

1. 用 \`send_message\` 向预建 sessionId 投递阶段任务（**禁止** \`subagent\` 工具新建）。
2. 投递后**停止调度**，等待 DSH 向本对话写入 \`subagent-settled\` 结算通知（含终止原因与 closing message）。这是子代理完成的权威信号。
3. **禁止**用 \`list_agents\` 轮询完成——该工具说明写明 "not to poll for completion"。其 \`running\`/\`idle\`/\`ready\` 只描述 live registry，**不代表**磁盘产物已写入或已验收。
4. **禁止**用 bash/sleep 循环等待产物落盘；长时阻塞会延迟处理 settled 通知，造成「子代理已结束、编排者仍在等待」的假象。
5. 收到 settled 通知后：读取 UNIT_ROOT 下该阶段 \`index.json\` 与蓝图完成标准做 BHV-02 验收；不得仅凭子代理 closing message 或 list_agents 状态判定完成。`,
  'run.roster': '已预建子代理（**禁止**使用 subagent 工具新建；请用 send_message 复用下列 sessionId；list_agents 仅用于核对 id，不可轮询完成）：',
  'design.user': `{{reply}}
你是 POMASA MAS 设计助手。当前工作目录是 MAS 根（可修改整个 MAS 系统文件夹）：

{{masRoot}}

目录结构：
- pomasa.json — MAS 描述符与阶段契约
- agents/ — 各 agent 蓝图（Markdown），修改 agent 行为请编辑对应文件
- references/ — 参考资料
- user_input.md — 创建时的用户需求摘要
- workspace/ — 运行沙箱（**不要在设计模式下**往 workspace/<unit>/<task>/ 写运行产物）

已声明的 agent：
{{agents}}

请帮助研究者修改蓝图与 MAS 配置。保持就绪，等待用户说明要修改哪一部分。`,
  'design.agents.empty': '- （无）',
  'design.assistant': '已就位。我将在这个 MAS 根目录下协助你修改蓝图与配置。请告诉我你要调整哪个 agent 或哪部分内容。',
  'gen.body': `{{reply}}
你是 POMASA 生成器。请严格遵守以下指示完成 MAS 生成：

- 生成器 skill：{{skill}}
- 用户输入：{{userInput}}

流程：先读 SKILL.md，按其要求先读 pattern-catalog/README.md，再读全部 Required 模式文档（COR-01/02、STR-01/06、BHV-02、QUA-03、OBV-01/02/03），然后读 user_input.md，把完整的 MAS 生成到当前工作目录。

注意：SKILL.md 中的相对路径（如 ./pattern-catalog/）以 {{skillDir}} 目录为基准解析；所有生成输出写入 MAS 根目录 {{masRoot}}。
不要提问，按流程执行。生成的蓝图与回复须使用 user_input.md 中的 Agent Blueprint Language。`,
  'userInput.aiSuggest': '由 AI 建议',
  'userInput.aiSuggestList': '- （由 AI 建议）',
  'userInput.defaultData': '公开网络信息',
  'userInput.defaultReport': '研究报告',
  'userInput.none': '无',
  'userInput.other': '无。请注意：本系统由 POMASA Studio 托管，输出格式统一为 Markdown，不需要 DOCX/PDF 导出管线。',
  'userInput.pandoc': `**Report Formatting**（隐含规格，必选）：最终报告必须符合 Pandoc-Ready Markdown 格式（POMASA STR-08）。
- 引用文献一律做成 pandoc 脚注：正文引用处以 \`[^n]\` 标注（如 \`[^src01]\`），脚注定义 \`[^n]: ...\` 统一放在文档末尾的脚注定义区；不要把引注写成内联链接或堆在文末大段列表里。
- 全文档只有一个一级标题（#）；章节用二级及以下标题，层级连续不跳级。
- 标题、列表、代码块、引用、表格等块级元素前后各留一个空行；列表统一用 \`-\`，嵌套用 2 空格缩进。
- 中文报告使用全角标点（“”、、，。），不用 ASCII 直引号。`,
}

const EN = {
  'prompt.reply': 'Think and reply in English (this MAS blueprint language is English).',
  'warm.orch.user': `{{reply}}
You are the standby Orchestrator instance for this MAS. Read the blueprint first: {{blueprint}}

Current task unit root (run sandbox): {{unitRoot}}
Stay on standby. Do not start stage work or write artifacts until the researcher starts a run or gives instructions; then orchestrate stages per the blueprint.`,
  'warm.orch.assistant': 'Standing by. I have read the standby instructions and will wait for a run command before orchestrating stages per the blueprint.',
  'warm.stage.user': `{{reply}}
You are the standby stage subagent "{{title}}" ({{key}}). Read the blueprint first: {{blueprint}}

Current task unit root: {{unitRoot}}
Stay on standby. Do not start work or write files outside the unit root until the Orchestrator dispatches this stage.`,
  'warm.stage.assistant': 'Standing by. I am stage subagent "{{title}}" and will wait for the Orchestrator to dispatch me.',
  'run.fresh': 'This run starts from a clean unit root: do not keep or reuse prior outputs; execute the blueprint from scratch.',
  'run.continue': 'This run continues from existing outputs: keep files already in the unit root; do not wipe them. Follow the researcher instruction to decide what to keep, rewrite, or delete. Researcher instruction: {{instruction}}',
  'run.continue.empty': '(no extra instruction; continue normally from existing outputs)',
  'run.body': `{{reply}}
You are the Orchestrator of this MAS. Run unit: {{unitKey}}.

Open {{orchBlueprint}} and execute this run strictly per that blueprint (create and maintain {{runJson}} per OBV-03; dispatch stage subagents as needed; each stage maintains its index.json per OBV-01).
{{continueNote}}
The unit root (run sandbox) for this run is: {{unitRoot}}
All run-time file writes, including run notes, must stay inside the unit root; do not write outside it (for example MAS-root wip/). The session working directory is the POMASA workspace, not the unit root; read and write using the unit root's absolute path.
{{protocol}}
Do not ask questions; follow the process.`,
  'run.protocol': `
## Subagent dispatch and waiting (send_message)

1. Deliver each stage task with \`send_message\` to a prebuilt sessionId (**do not** create new agents with the \`subagent\` tool).
2. After sending, **stop scheduling** and wait for DSH to write a \`subagent-settled\` notice into this conversation (termination reason and closing message). That notice is the authoritative completion signal.
3. **Do not** poll for completion with \`list_agents\` — the tool description says "not to poll for completion". Its \`running\`/\`idle\`/\`ready\` states describe the live registry only, **not** that artifacts are on disk or accepted.
4. **Do not** bash/sleep-loop waiting for files; long blocking delays handling of settled notices and looks like "the subagent finished but the orchestrator is still waiting".
5. After a settled notice: read that stage's \`index.json\` under UNIT_ROOT and check blueprint completion criteria (BHV-02). Do not judge completion from the subagent closing message or list_agents status alone.`,
  'run.roster': 'Prebuilt subagents (**do not** create new ones with the subagent tool; reuse these sessionIds via send_message; list_agents is only for checking ids, not for polling completion):',
  'design.user': `{{reply}}
You are the POMASA MAS design assistant. The working directory is the MAS root (you may edit the whole MAS folder):

{{masRoot}}

Layout:
- pomasa.json — MAS descriptor and stage contracts
- agents/ — agent blueprints (Markdown); edit these files to change agent behavior
- references/ — reference materials
- user_input.md — original request summary
- workspace/ — run sandbox (**do not** write run artifacts under workspace/<unit>/<task>/ in design mode)

Declared agents:
{{agents}}

Help the researcher edit blueprints and MAS config. Stay ready until they say which part to change.`,
  'design.agents.empty': '- (none)',
  'design.assistant': 'Standing by. I will help you edit blueprints and config in this MAS root. Tell me which agent or section to change.',
  'gen.body': `{{reply}}
You are the POMASA generator. Follow these instructions to generate the MAS:

- Generator skill: {{skill}}
- User input: {{userInput}}

Process: read SKILL.md first; per that file read pattern-catalog/README.md, then every Required pattern (COR-01/02, STR-01/06, BHV-02, QUA-03, OBV-01/02/03), then user_input.md, and generate the complete MAS into the current working directory.

Note: relative paths in SKILL.md (such as ./pattern-catalog/) resolve against {{skillDir}}; write all generated output into the MAS root {{masRoot}}.
Do not ask questions; follow the process. Generated blueprints and replies must use the Agent Blueprint Language from user_input.md.`,
  'userInput.aiSuggest': 'AI to suggest',
  'userInput.aiSuggestList': '- (AI to suggest)',
  'userInput.defaultData': 'public web information',
  'userInput.defaultReport': 'research report',
  'userInput.none': 'None',
  'userInput.other': 'None. This system is hosted by POMASA Studio; output is Markdown only — no DOCX/PDF export pipeline.',
  'userInput.pandoc': `**Report Formatting** (implicit, required): the final report must be Pandoc-Ready Markdown (POMASA STR-08).
- Cite sources as pandoc footnotes: mark in-text citations with \`[^n]\` (e.g. \`[^src01]\`) and put \`[^n]: ...\` definitions in a footnote block at the end; do not use inline links or a dump list of references.
- Exactly one top-level heading (#); sections use level-2 and below, without skipping levels.
- Leave a blank line before and after block elements (headings, lists, code, quotes, tables); lists use \`-\`, nested lists indent by 2 spaces.
- English reports use standard English punctuation, not fullwidth CJK marks.`,
}

const TABLES = { zh: ZH, en: EN }

export function promptT(lang, key, vars) {
  const table = TABLES[lang] || ZH
  let s = (table && table[key]) || ZH[key] || key
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = String(s).split('{{' + k + '}}').join(String(vars[k]))
    }
  }
  return s
}
