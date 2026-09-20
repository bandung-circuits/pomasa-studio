// Artifact cards and stage contract listing (bottom panel content).
import { actionBus } from '../actions/bus.js'
import { STAGE_STATUS_TEXT, psEmpty } from '../components.js'
import { t } from '../i18n.js'
import { useLocators } from '../locators/context.js'
import { ScrollBox, ScrollFrame } from '../scrollbox/box.js'
import { getServices } from '../services/index.js'
import { currentStage, taskManager, useTaskManager } from '../task-manager/store.js'
import { fmtSize, resolveArtifactPath, str } from '../util.js'

function ArtifactCard(props) {
  const { entry, presetTitle, path, forceTitle, active, onClick, contract, onHead } = props
  const [h1, setH1] = React.useState(null)
  React.useEffect(() => {
    if (!forceTitle || !path || typeof onHead !== 'function') return
    let stop = false
    onHead(path)
      .then((r) => { if (!stop && r && r.ok && r.title) setH1(r.title) })
      .catch(() => {})
    return () => { stop = true }
  }, [path, forceTitle, onHead])
  const title = str(forceTitle && h1 ? h1 : presetTitle)
  const file = str((entry && (entry.file || entry.path)) || path)
  return h('div', { className: 'ps-card ps-art' + (active ? ' on' : ''), onClick },
    h('div', { className: 'ps-art-title' }, title),
    entry.subtitle ? h('div', { className: 'ps-art-sub' }, str(entry.subtitle)) : null,
    entry.summary ? h('div', { className: 'ps-art-sum' }, str(entry.summary)) : null,
    h('div', { className: 'ps-art-meta' },
      h('span', null, file.split('/').pop()),
      entry.size ? h('span', null, fmtSize(entry.size)) : null,
      contract ? h('span', null, contract) : null,
    ),
  )
}

export function stageContractCards(stage, unit, api, openArtifact, artifact, onHead) {
  if (!stage) return null
  if (!stage.contracts || !stage.contracts.length) {
    return h(psEmpty, { title: t('stage.no.contract'), hint: t('stage.no.contract.hint', { t: str(stage.title) }) })
  }
  const all = []
  const seen = new Set()
  const multi = new Set()
  for (const c of stage.contracts) {
    const entries = Array.isArray(c.index) ? c.index : []
    for (const e of entries || []) {
      if (!e || typeof e !== 'object') continue
      const matched = e.id != null
        ? stage.contracts.find((x) => x.id != null && String(x.id) === String(e.id))
        : undefined
      const owner = matched || c
      const path = resolveArtifactPath(owner, e)
      if (!path) continue
      if (seen.has(path)) { multi.add(path); continue }
      seen.add(path)
      all.push({ contract: owner.id, contractTitle: owner.title, entry: e, path })
    }
  }
  if (stage.status !== 'completed' && !all.length) {
    return h(psEmpty, { title: t('stage.no.artifacts'), hint: t('stage.no.artifacts.hint', { st: STAGE_STATUS_TEXT[stage.status] ? STAGE_STATUS_TEXT[stage.status]() : str(stage.status) }) })
  }
  if (!all.length) {
    return h(psEmpty, { title: t('stage.no.artifact'), hint: t('stage.empty.hint', { t: str(stage.title) }) })
  }
  return h('div', { className: 'ps-artlist' },
    all.map((a, idx) => {
      const e = a.entry
      const active = artifact && artifact.path === a.path
      return h(ArtifactCard, {
        key: idx,
        entry: e,
        presetTitle: str(e.title || e.id || e.path || e.file) || t('artifact.unnamed'),
        path: a.path,
        forceTitle: multi.has(a.path),
        onHead,
        active,
        onClick: () => openArtifact(a.path, a.entry),
        contract: a.contractTitle ? str(a.contractTitle) : (a.contract ? str(a.contract) : null),
      })
    }),
  )
}

export function SubagentDetailsPanel() {
  const loc = useLocators()
  const tm = useTaskManager()
  const stage = currentStage(tm)
  const api = getServices()
  const openArtifact = (artifactPath, entry) => {
    taskManager.setSelectedArtifact({ path: artifactPath, entry })
    actionBus.emit('file.open', {
      kind: 'artifact',
      masId: loc.masId,
      unitKey: loc.unitKey,
      taskKey: loc.taskKey,
      path: artifactPath,
      entry,
    })
  }
  const onHead = React.useCallback((p) => api.artifactHead(loc.masId, loc.unitKey, loc.taskKey, p), [api, loc.masId, loc.unitKey, loc.taskKey])
  let body
  if (!stage) body = h(psEmpty, { title: t('choose.stage') })
  else if (stage.isOrchestrator || stage.id === 'orchestrator') {
    body = h(psEmpty, { title: str(stage.title), hint: t('orch.no.artifacts') })
  } else {
    body = stageContractCards(stage, loc.unitKey, api, openArtifact, tm.selectedArtifact, onHead)
  }
  return h(ScrollFrame, null, h(ScrollBox, null, body))
}
