import fs from 'node:fs'
import path from 'node:path'
import { masDir, pomasaHome } from '../paths/index.js'

/**
 * Build the user_input markdown from the Studio form fields.
 * Output format is forced to Markdown only (DESIGN decision 2 + appendix A):
 * the Studio exports on demand, so no DOCX/PDF pipeline is generated.
 */
export function buildUserInput(f) {
  const run =
    f.runMode === 'multi'
      ? `**How is work divided into runs?**

- [ ] Run once as a whole system
- [x] Run the MAS separately for each research object (e.g. per country or per date), each run isolated from the others

**Research Object Dimension** (e.g. country, date): ${f.runDimensions || '由 AI 建议'}

**Initial Research Objects** (optional, one per line):
${Array.isArray(f.runUnits) && f.runUnits.length ? f.runUnits.map((u) => `- ${u}`).join('\n') : '- （由 AI 建议）'}
`
      : `**How is work divided into runs?**

- [x] Run once as a whole system
- [ ] Run the MAS separately for each research object (e.g. per country or per date), each run isolated from the others
`
  // Implicit Studio requirement (POMASA STR-08, Pandoc-Ready Markdown): every
  // generated report must cite its references as pandoc footnotes and follow
  // the pandoc-ready formatting rules, so the final report converts cleanly
  // instead of accumulating a messy ad-hoc reference section.
  const pandocSpec = [
    '**Report Formatting**（隐含规格，必选）：最终报告必须符合 Pandoc-Ready Markdown 格式（POMASA STR-08）。',
    '- 引用文献一律做成 pandoc 脚注：正文引用处以 `[^n]` 标注（如 `[^src01]`），脚注定义 `[^n]: ...` 统一放在文档末尾的脚注定义区；不要把引注写成内联链接或堆在文末大段列表里。',
    '- 全文档只有一个一级标题（#）；章节用二级及以下标题，层级连续不跳级。',
    '- 标题、列表、代码块、引用、表格等块级元素前后各留一个空行；列表统一用 `-`，嵌套用 2 空格缩进。',
    '- 中文报告使用全角标点（“”、、，。），不用 ASCII 直引号。',
  ].join('\n')
  return `# User Input

## Language Settings

**Agent Blueprint Language**: ${f.language || 'Chinese'}

**Report Output Language**: ${f.reportLanguage || f.language || 'Chinese'}

---

## Research Project Basic Information

**Project Identifier**: ${f.projectId}

**Research Topic and Core Questions**: ${f.topic}

**Initial Ideas and Insights**: ${f.ideas || '由 AI 建议'}

---

## Data Collection

**Data Sources**: ${f.dataSources || '公开网络信息'}

**Existing Reference Materials**:
${Array.isArray(f.refs) && f.refs.length ? f.refs.map((r) => `- ${r}`).join('\n') : '- （由 AI 建议）'}

---

## Analysis Methods

**Analysis Methods**: ${f.analysis || '由 AI 建议'}

---

## Output Format

**Report Format**: ${f.reportFormat || '研究报告'}

**Report Structure**: ${f.reportStructure || '由 AI 建议'}

${pandocSpec}

---

## Run Unit Planning

${run}

---

## Pattern Selection

**Quality Assurance Level**: ${f.qaLevel || 'Standard'}

**Other Patterns to Enable or Disable**: ${f.patterns || '无'}

---

## Other Requirements

${f.other || '无。请注意：本系统由 POMASA Studio 托管，输出格式统一为 Markdown，不需要 DOCX/PDF 导出管线。'}
`
}

/** Write user_input.md into the MAS root (the generation session reads it). */
export function writeUserInput(config, masId, fields) {
  const root = masDir(pomasaHome(config), masId)
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(path.join(root, 'user_input.md'), buildUserInput(fields), 'utf8')
}

/** The prompt that drives a generation session. */
export function generationPrompt(skill, masId, masRoot) {
  return `你是 POMASA 生成器。请严格遵守以下指示完成 MAS 生成：

- 生成器 skill：${path.join(skill, 'SKILL.md')}
- 用户输入：${path.join(masRoot, 'user_input.md')}

流程：先读 SKILL.md，按其要求先读 pattern-catalog/README.md，再读全部 Required 模式文档（COR-01/02、STR-01/06、BHV-02、QUA-03、OBV-01/02/03），然后读 user_input.md，把完整的 MAS 生成到当前工作目录。

注意：SKILL.md 中的相对路径（如 ./pattern-catalog/）以 ${skill} 目录为基准解析；所有生成输出写入 MAS 根目录 ${masRoot}。
不要提问，按流程执行。`
}

/** How orchestrators must wait on continuable subagents (DSH send_message path). */
export function subagentSchedulingProtocol() {
  return `
## 子代理调度与等待（send_message）

1. 用 \`send_message\` 向预建 sessionId 投递阶段任务（**禁止** \`subagent\` 工具新建）。
2. 投递后**停止调度**，等待 DSH 向本对话写入 \`subagent-settled\` 结算通知（含终止原因与 closing message）。这是子代理完成的权威信号。
3. **禁止**用 \`list_agents\` 轮询完成——该工具说明写明 "not to poll for completion"。其 \`running\`/\`idle\`/\`ready\` 只描述 live registry，**不代表**磁盘产物已写入或已验收。
4. **禁止**用 bash/sleep 循环等待产物落盘；长时阻塞会延迟处理 settled 通知，造成「子代理已结束、编排者仍在等待」的假象。
5. 收到 settled 通知后：读取 UNIT_ROOT 下该阶段 \`index.json\` 与蓝图完成标准做 BHV-02 验收；不得仅凭子代理 closing message 或 list_agents 状态判定完成。`
}

/** The prompt that starts a run session for one unit. */
export function runPrompt(masRoot, unitRoot, unitKey, opts) {
  const continueNote = opts && opts.mode === 'continue'
    ? `\n本次运行基于既有成果继续：保留单元根内已有产物，不要清空。严格按照研究者的指令决定保留、改写或删除哪些产物。研究者指令：${opts.instruction || '（无额外指令，在既有成果基础上正常推进）'}\n`
    : '\n本次运行从干净单元根开始：不要保留、不要沿用上轮产物，按蓝图全新执行。\n'
  return `你是本 MAS 的编排者（Orchestrator）。本次运行单元：${unitKey ?? 'single'}。

请打开 ${path.join(masRoot, 'agents', '00.orchestrator.md')}，严格按照该蓝图执行本次运行（按 OBV-03 协议创建并维护 ${path.join(unitRoot, 'run.json')}，按需调用各阶段子代理，各阶段按 OBV-01 维护其 index.json）。${continueNote}
本次运行的单元根（运行沙箱）是：${unitRoot}
运行期所有文件写入、包括运行笔记，都必须放在单元根内；不要尝试写单元根之外的路径（如 MAS 根的 wip/）。会话的工作目录是 POMASA 工作区，不等于单元根；所有读写请以单元根的绝对路径为准。
${subagentSchedulingProtocol()}
不要提问，按流程执行。`
}