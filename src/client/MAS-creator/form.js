// Pattern catalog for the create form (bilingual catalog content, not chrome i18n).
import { psBtn } from '../buttons/button.js'
import { psField, psInput, psTextarea } from '../components.js'
import { portalSecondaryModal, psHierarchyBackdropProps } from '../hierachy/stack.js'
import { langStore, t, useLang } from '../i18n.js'

const CATALOG_PATTERNS = [
  { id: 'COR-01', zh: '提示词定义的智能体', en: 'Prompt-Defined Agent', zhD: 'agent 即自然语言蓝图', enD: 'agents are natural-language blueprints', nec: 'must' },
  { id: 'COR-02', zh: '智能运行时', en: 'Intelligent Runtime', zhD: '运行时解释蓝图执行', enD: 'runtime interprets blueprints', nec: 'must' },
  { id: 'STR-01', zh: '参考数据配置', en: 'Reference Data Configuration', zhD: '领域知识与 agent 逻辑分离', enD: 'separate domain knowledge from agent logic', nec: 'must' },
  { id: 'STR-06', zh: '方法论指导', en: 'Methodological Guidance', zhD: '研究方法内嵌进蓝图', enD: 'embed research method in blueprints', nec: 'must' },
  { id: 'BHV-02', zh: '忠实智能体实例化', en: 'Faithful Agent Instantiation', zhD: '子代理严格按蓝图执行', enD: 'subagents follow their blueprint', nec: 'must' },
  { id: 'QUA-03', zh: '可验证数据溯源', en: 'Verifiable Data Lineage', zhD: '产物可回溯到来源', enD: 'outputs traceable to sources', nec: 'must' },
  { id: 'STR-02', zh: '文件系统数据总线', en: 'Filesystem Data Bus', zhD: '阶段间靠文件传数据', enD: 'stages exchange data via files', nec: 'recommended' },
  { id: 'STR-03', zh: '工作区隔离', en: 'Workspace Isolation', zhD: '运行沙箱彼此隔离', enD: 'isolated run sandboxes', nec: 'recommended' },
  { id: 'STR-04', zh: '业务驱动智能体设计', en: 'Business-Driven Agent Design', zhD: '按研究维度切分 agent', enD: 'split agents along research dimensions', nec: 'recommended' },
  { id: 'STR-05', zh: '可组合文档装配', en: 'Composable Document Assembly', zhD: '分节撰写后统一装配', enD: 'assemble report from sections', nec: 'recommended' },
  { id: 'STR-07', zh: '反向工程研究问题', en: 'Reverse-Engineered Research Questions', zhD: '从目标结论倒推研究问题', enD: 'derive questions from target conclusions', nec: 'recommended' },
  { id: 'STR-08', zh: 'Pandoc 就绪 Markdown', en: 'Pandoc-Ready Markdown', zhD: '脚注引注，输出可直接转换', enD: 'footnote citations, conversion-ready output', nec: 'recommended' },
  { id: 'STR-09', zh: '交付物导出管线', en: 'Deliverable Export Pipeline', zhD: '产出 DOCX/PDF 交付物', enD: 'export docx/pdf deliverables', nec: 'recommended' },
  { id: 'BHV-01', zh: '编排式智能体流水线', en: 'Orchestrated Agent Pipeline', zhD: '阶段流水线逐级推进', enD: 'stages advance through the pipeline', nec: 'recommended' },
  { id: 'BHV-05', zh: '扎实的网络研究', en: 'Grounded Web Research', zhD: '抓原文再引用，不轻信摘要', enD: 'fetch sources, never trust snippets', nec: 'recommended' },
  { id: 'QUA-01', zh: '内嵌质量标准', en: 'Embedded Quality Standards', zhD: '质量标准写进蓝图自检', enD: 'quality criteria embedded in blueprints', nec: 'recommended' },
  { id: 'BHV-03', zh: '并行实例执行', en: 'Parallel Instance Execution', zhD: '多单元并行批量运行', enD: 'run units concurrently in batches', nec: 'optional' },
  { id: 'BHV-04', zh: '渐进式数据精炼', en: 'Progressive Data Refinement', zhD: '同一产物多轮迭代改进', enD: 'iterate on the same outputs across passes', nec: 'optional' },
  { id: 'BHV-06', zh: '可配置工具绑定', en: 'Configurable Tool Binding', zhD: '运行时按环境换工具', enD: 'swap tools per runtime environment', nec: 'optional' },
  { id: 'QUA-02', zh: '分层质量保障', en: 'Layered Quality Assurance', zhD: '多阶段交叉校验', enD: 'cross-check across stages', nec: 'optional' },
]

function PatternsModal(props) {
  const { patterns, onClose, onApply } = props
  const [draft, setDraft] = React.useState(patterns)
  const toggle = (id) => setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const en = langStore.val === 'en'
  const necLabel = (n) => en ? ({ must: 'Always', recommended: 'Recommended', optional: 'Optional' })[n] : ({ must: '必选', recommended: '推荐', optional: '可选' })[n]
  return h('div', Object.assign({}, psHierarchyBackdropProps('secondary', 0), { onClick: onClose }),
    h('div', { className: 'ps-modal ps-modal-wide', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'ps-modal-head' },
        h('span', { style: { fontWeight: 600, fontSize: 15 } }, t('field.patterns')),
        h('span', { className: 'spacer', style: { flex: 1 } }),
        h(psBtn, { ghost: true, onClick: onClose }, '✕'),
      ),
      h('div', { className: 'ps-modal-body' },
        h('div', { className: 'ps-patterns-grid' },
          CATALOG_PATTERNS.map((p) => {
            const locked = p.nec === 'must'
            const on = locked || draft.includes(p.id)
            return h('label', { key: p.id, className: 'ps-pattern' + (on ? ' on' : '') + (locked ? ' must' : '') },
              h('input', { type: 'checkbox', disabled: locked, checked: on, onChange: () => toggle(p.id) }),
              h('span', { className: 'ps-pattern-body' },
                h('span', { className: 'ps-pattern-title' }, p.id + ' ' + (en ? p.en : p.zh)),
                h('span', { className: 'ps-pattern-desc' }, en ? p.enD : p.zhD),
              ),
              h('span', { className: 'ps-pattern-nec ' + p.nec }, necLabel(p.nec)),
            )
          }),
        ),
        h('div', { className: 'ps-toolbar', style: { marginTop: 16, justifyContent: 'flex-end' } },
          h(psBtn, { ghost: true, onClick: onClose }, t('create.cancel')),
          h(psBtn, { primary: true, onClick: () => onApply(draft) }, t('patterns.apply')),
        ),
      ),
    ),
  )
}

export function CreateMas(props) {
  const api = props.api
  const lang = useLang()
  const [f, setF] = React.useState(() => ({
    name: '', projectId: '', language: 'Chinese', reportLanguage: 'Chinese',
    topic: '', ideas: '', dataSources: t('create.default.dataSources'), refs: '',
    analysis: '', reportFormat: t('create.default.reportFormat'), reportStructure: '',
    runMode: 'single', runDimensions: '', runUnits: '',
    qaLevel: 'Standard', other: '',
  }))
  const [patterns, setPatterns] = React.useState([])
  const [patternsOpen, setPatternsOpen] = React.useState(false)
  const langRef = React.useRef(lang)
  React.useEffect(() => {
    if (langRef.current === lang) return
    const prev = langRef.current
    langRef.current = lang
    setF((pf) => {
      const nf = Object.assign({}, pf)
      if (nf.dataSources === t('create.default.dataSources', null, prev)) nf.dataSources = t('create.default.dataSources')
      if (nf.reportFormat === t('create.default.reportFormat', null, prev)) nf.reportFormat = t('create.default.reportFormat')
      return nf
    })
  }, [lang])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState(null)
  const set = (k) => (e) => setF((prev) => Object.assign({}, prev, { [k]: e.target.value }))

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const fields = Object.assign({}, f, {
        refs: f.refs.split('\n').map((s) => s.trim()).filter(Boolean),
        runUnits: f.runUnits.split('\n').map((s) => s.trim()).filter(Boolean),
        patterns: patterns.length
          ? CATALOG_PATTERNS.filter((x) => patterns.includes(x.id)).map((x) => x.id + ' ' + (lang === 'en' ? x.en : x.zh)).join('、')
          : '',
      })
      const r = await api.createMas(fields)
      if (!r.ok) { setError(r.error || t('create.failed')); return }
      if (r.generation === 'external') { setError(t('create.ext.error')); return }
      if (r.generation === 'client' && props.onGeneration) {
        const d = await props.onGeneration(r.masId, r.prompt)
        if (!d.ok) { setError(d.error || t('gen.start.failed')); return }
      }
      props.onDone(r.masId)
    } catch (e) {
      setError(String(e && e.message || e))
    } finally {
      setBusy(false)
    }
  }

  if (props.open === false) return null

  return portalSecondaryModal(0,
    h('div', Object.assign({}, psHierarchyBackdropProps('secondary', 0), { onClick: props.onCancel }),
    h('div', { className: 'ps-modal ps-modal-wide', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'ps-modal-head' },
        h('span', { style: { fontWeight: 600, fontSize: 15 } }, t('new.mas')),
        h('span', { className: 'spacer', style: { flex: 1 } }),
        h(psBtn, { ghost: true, onClick: props.onCancel }, '✕'),
      ),
      h('div', { className: 'ps-modal-body' },
        h('div', { className: 'ps-sub', style: { marginTop: 0 } }, t('create.subtitle')),
        error ? h('div', { className: 'ps-notice err' }, error) : null,
        h('div', { className: 'ps-form-row' },
          psField({ label: h('span', null, t('field.projectId'), h('span', { className: 'ps-req' }, ' *')) }, h(psInput, { value: f.projectId, onChange: set('projectId'), placeholder: t('ph.projectId') })),
          psField({ label: t('field.name') }, h(psInput, { value: f.name, onChange: set('name'), placeholder: t('ph.name') })),
        ),
        h('div', { className: 'ps-form-row' },
          psField({ label: t('field.language') }, h(psInput, { value: f.language, onChange: set('language') })),
          psField({ label: t('field.reportLanguage') }, h(psInput, { value: f.reportLanguage, onChange: set('reportLanguage') })),
        ),
        psField({ label: h('span', null, t('field.topic'), h('span', { className: 'ps-req' }, ' *')), hint: t('field.topic.hint') },
          h(psTextarea, { value: f.topic, onChange: set('topic'), placeholder: t('ph.topic') })),
        psField({ label: t('field.ideas') }, h(psTextarea, { value: f.ideas, onChange: set('ideas') })),
        psField({ label: t('field.refs') }, h(psTextarea, { value: f.refs, onChange: set('refs') })),
        psField({ label: t('field.analysis') }, h(psTextarea, { value: f.analysis, onChange: set('analysis') })),
        h('div', { className: 'ps-form-row' },
          psField({ label: t('field.dataSources') }, h(psInput, { value: f.dataSources, onChange: set('dataSources') })),
          psField({ label: t('field.reportFormat') }, h(psInput, { value: f.reportFormat, onChange: set('reportFormat') })),
        ),
        psField({ label: t('field.reportStructure') }, h(psTextarea, { value: f.reportStructure, onChange: set('reportStructure'), style: { minHeight: 96 } })),
        h('div', { className: 'ps-form-row' },
          psField({ label: t('field.runMode'), hint: t('field.runMode.hint') },
            h('select', { className: 'ps-select', value: f.runMode, onChange: set('runMode') },
              h('option', { value: 'single' }, t('runMode.single')),
              h('option', { value: 'multi' }, t('runMode.multi')),
            )),
          h('div', { className: 'ps-field h-nowrap' },
            h('label', null, t('field.runDimensions')),
            h(psInput, { value: f.runDimensions, onChange: set('runDimensions'), disabled: f.runMode !== 'multi' }),
          ),
        ),
        f.runMode === 'multi' ?
          psField({ label: t('field.runUnits') }, h(psTextarea, { value: f.runUnits, onChange: set('runUnits') })) : null,
        psField({ label: t('field.qaLevel') },
          h('select', { className: 'ps-select', value: f.qaLevel, onChange: set('qaLevel') },
            h('option', { value: 'Simple' }, t('qa.simple')),
            h('option', { value: 'Standard' }, t('qa.standard')),
            h('option', { value: 'Strict' }, t('qa.strict')),
          )),
        psField({ label: t('field.patterns') }, h('div', { className: 'ps-patterns-open' },
          h('div', { className: 'ps-patterns-summary' },
            patterns.length
              ? t('patterns.selected', { n: patterns.length }) + '：' + CATALOG_PATTERNS.filter((x) => patterns.includes(x.id)).map((x) => x.id).join('、')
              : t('patterns.none')),
          h(psBtn, { primary: true, onClick: () => setPatternsOpen(true) }, t('patterns.open')),
        )),
        psField({ label: t('field.other') }, h(psTextarea, { value: f.other, onChange: set('other') })),
        h('div', { className: 'ps-toolbar', style: { marginBottom: 0, marginTop: 8 } },
          h(psBtn, { primary: true, disabled: busy || !f.projectId.trim() || !f.topic.trim(), onClick: submit }, busy ? t('create.busy') : t('create.submit')),
          h('span', { className: 'ps-muted' }, t('create.output.note')),
        ),
        patternsOpen ? h(PatternsModal, { patterns, onClose: () => setPatternsOpen(false), onApply: (next) => { setPatterns(next); setPatternsOpen(false) } }) : null,
      ),
    ),
  ))
}
