import fs from 'node:fs'
import path from 'node:path'
import { masDir, pomasaHome } from '../paths/index.js'
import { promptLangFromMasRoot, promptLangFromValue, promptT } from '../prompts/index.js'

/**
 * Build the user_input markdown from the Studio form fields.
 * Output format is forced to Markdown only (DESIGN decision 2 + appendix A):
 * the Studio exports on demand, so no DOCX/PDF pipeline is generated.
 */
export function buildUserInput(f) {
  const lang = promptLangFromValue(f.language)
  const ai = promptT(lang, 'userInput.aiSuggest')
  const run =
    f.runMode === 'multi'
      ? `**How is work divided into runs?**

- [ ] Run once as a whole system
- [x] Run the MAS separately for each research object (e.g. per country or per date), each run isolated from the others

**Research Object Dimension** (e.g. country, date): ${f.runDimensions || ai}

**Initial Research Objects** (optional, one per line):
${Array.isArray(f.runUnits) && f.runUnits.length ? f.runUnits.map((u) => `- ${u}`).join('\n') : promptT(lang, 'userInput.aiSuggestList')}
`
      : `**How is work divided into runs?**

- [x] Run once as a whole system
- [ ] Run the MAS separately for each research object (e.g. per country or per date), each run isolated from the others
`
  const pandocSpec = promptT(lang, 'userInput.pandoc')
  return `# User Input

## Language Settings

**Agent Blueprint Language**: ${f.language || (lang === 'en' ? 'English' : 'Chinese')}

**Report Output Language**: ${f.reportLanguage || f.language || (lang === 'en' ? 'English' : 'Chinese')}

---

## Research Project Basic Information

**Project Identifier**: ${f.projectId}

**Research Topic and Core Questions**: ${f.topic}

**Initial Ideas and Insights**: ${f.ideas || ai}

---

## Data Collection

**Data Sources**: ${f.dataSources || promptT(lang, 'userInput.defaultData')}

**Existing Reference Materials**:
${Array.isArray(f.refs) && f.refs.length ? f.refs.map((r) => `- ${r}`).join('\n') : promptT(lang, 'userInput.aiSuggestList')}

---

## Analysis Methods

**Analysis Methods**: ${f.analysis || ai}

---

## Output Format

**Report Format**: ${f.reportFormat || promptT(lang, 'userInput.defaultReport')}

**Report Structure**: ${f.reportStructure || ai}

${pandocSpec}

---

## Run Unit Planning

${run}

---

## Pattern Selection

**Quality Assurance Level**: ${f.qaLevel || 'Standard'}

**Other Patterns to Enable or Disable**: ${f.patterns || promptT(lang, 'userInput.none')}

---

## Other Requirements

${f.other || promptT(lang, 'userInput.other')}
`
}

/** Write user_input.md into the MAS root (the generation session reads it). */
export function writeUserInput(config, masId, fields) {
  const root = masDir(pomasaHome(config), masId)
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(path.join(root, 'user_input.md'), buildUserInput(fields), 'utf8')
}

/** The prompt that drives a generation session. */
export function generationPrompt(skill, masId, masRoot, lang) {
  const l = lang || promptLangFromMasRoot(masRoot)
  return promptT(l, 'gen.body', {
    reply: promptT(l, 'prompt.reply'),
    skill: path.join(skill, 'SKILL.md'),
    userInput: path.join(masRoot, 'user_input.md'),
    skillDir: skill,
    masRoot,
  })
}

/** How orchestrators must wait on continuable subagents (DSH send_message path). */
export function subagentSchedulingProtocol(lang) {
  return promptT(lang || 'zh', 'run.protocol')
}

/** The prompt that starts a run session for one unit. */
export function runPrompt(masRoot, unitRoot, unitKey, opts, lang) {
  const l = lang || promptLangFromMasRoot(masRoot)
  const continueNote = opts && opts.mode === 'continue'
    ? promptT(l, 'run.continue', { instruction: opts.instruction || promptT(l, 'run.continue.empty') })
    : promptT(l, 'run.fresh')
  return promptT(l, 'run.body', {
    reply: promptT(l, 'prompt.reply'),
    unitKey: unitKey ?? 'single',
    orchBlueprint: path.join(masRoot, 'agents', '00.orchestrator.md'),
    runJson: path.join(unitRoot, 'run.json'),
    continueNote,
    unitRoot,
    protocol: subagentSchedulingProtocol(l),
  })
}