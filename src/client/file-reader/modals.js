// File reader overlays — blueprint, artifact viewer, rerun chooser.
import { actionBus } from '../actions/bus.js'
import { psBtn } from '../buttons/button.js'
import { psTextarea } from '../components.js'
import { portalSecondaryModal, psHierarchyBackdropProps, snapshotHierarchyBase } from '../hierachy/stack.js'
import { t } from '../i18n.js'
import { renderMarkdown } from '../md.js'
import { getServices } from '../services/index.js'
import { taskManager } from '../task-manager/store.js'
import { downloadBlob, prettyJson, str } from '../util.js'

function modalHierarchyBase(props) {
  return props && props.hierarchyBase != null ? props.hierarchyBase : 0
}

function BlueprintModal(props) {
  const { onExport } = props
  const hierBase = modalHierarchyBase(props)
  const [data, setData] = React.useState(null)
  const [err, setErr] = React.useState(null)
  React.useEffect(() => {
    let stop = false
    props.api.blueprintRead(props.masId, props.path, props.stage)
      .then((r) => { if (!stop) { if (r.ok) setData(r); else setErr(r.error || t('artifact.read.fail')) } })
      .catch((e) => { if (!stop) setErr(String(e && e.message || e)) })
    return () => { stop = true }
  }, [props.masId, props.path, props.api, props.stage])
  return portalSecondaryModal(hierBase,
    h('div', Object.assign({}, psHierarchyBackdropProps('secondary', hierBase), { onClick: props.onClose }),
      h('div', { className: 'ps-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, str(props.title) + ' · ' + t('modal.blueprint')),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          onExport && data && data.format === 'markdown' ? h(psBtn, { ghost: true, onClick: () => onExport(str(data.content), 'docx', str(props.title) || 'blueprint') }, t('export.docx')) : null,
          h(psBtn, { ghost: true, onClick: props.onClose }, '✕'),
        ),
        h('div', { className: 'ps-modal-body' },
          err ? h('div', { className: 'ps-muted' }, err)
            : data === null ? h('div', { className: 'ps-muted' }, t('loading'))
            : data.format === 'markdown' ? renderMarkdown(String(data.content || ''))
            : data.format === 'json' ? h('pre', { className: 'ps-pre' }, prettyJson(String(data.content || '')))
            : h('pre', { className: 'ps-pre' }, String(data.content || '')),
        ),
      ),
    ),
  )
}

function ArtifactModal(props) {
  const { viewer, onClose, onDownload, onExport } = props
  const hierBase = modalHierarchyBase(props)
  const exportBase = (str(viewer.path).split('/').pop() || 'artifact').replace(/\.md$/i, '')
  return portalSecondaryModal(hierBase,
    h('div', Object.assign({}, psHierarchyBackdropProps('secondary', hierBase), { onClick: onClose }),
      h('div', { className: 'ps-modal ps-modal-wide', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { flex: 1, fontWeight: 600, fontSize: 15, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, str(viewer.path)),
          h('span', { className: 'ps-muted' }, str(viewer.format)),
          h(psBtn, { ghost: true, onClick: onDownload }, t('artifact.download')),
          onExport ? h(psBtn, { ghost: true, onClick: () => onExport(str(viewer.content), 'docx', exportBase) }, t('export.docx')) : null,
          h(psBtn, { ghost: true, onClick: onClose }, '✕'),
        ),
        h('div', { className: 'ps-modal-body ps-artifact-body' },
          viewer.format === 'json'
            ? h('pre', { className: 'ps-pre' }, prettyJson(String(viewer.content || '')))
            : viewer.format === 'markdown'
              ? renderMarkdown(String(viewer.content || ''))
              : h('pre', { className: 'ps-pre' }, String(viewer.content || '')),
        ),
      ),
    ),
  )
}

function RerunModal(props) {
  const { unitKey, onClose, onRun } = props
  const hierBase = modalHierarchyBase(props)
  const [step, setStep] = React.useState('choose')
  const [mode, setMode] = React.useState('fresh')
  const [text, setText] = React.useState('')
  const choose = (m) => { setMode(m); setStep('confirm') }
  const confirmRun = () => onRun(mode, text)
  return portalSecondaryModal(hierBase,
    h('div', Object.assign({}, psHierarchyBackdropProps('secondary', hierBase), { onClick: onClose }),
      h('div', { className: 'ps-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'ps-modal-head' },
          h('span', { style: { fontWeight: 600, fontSize: 15 } }, t('rerun.title')),
          h('span', { className: 'spacer', style: { flex: 1 } }),
          h(psBtn, { ghost: true, onClick: onClose }, '✕'),
        ),
        h('div', { className: 'ps-modal-body' },
          step === 'choose' ? h('div', { className: 'ps-rerun' },
            h('div', { className: 'ps-rerun-opt' },
              h('div', { className: 'ps-rerun-opt-title' }, t('rerun.fresh')),
              h('div', { className: 'ps-rerun-opt-body' }, t('rerun.fresh.body')),
              h(psBtn, { className: 'ps-rerun-fresh', onClick: () => choose('fresh') }, t('rerun.fresh.go')),
            ),
            h('div', { className: 'ps-rerun-opt' },
              h('div', { className: 'ps-rerun-opt-title' }, t('rerun.continue')),
              h('div', { className: 'ps-rerun-opt-body' }, t('rerun.continue.body')),
              h(psTextarea, { className: 'ps-rerun-input', value: text, placeholder: t('rerun.ph'), onChange: (e) => setText(e.target.value) }),
              h(psBtn, { primary: true, disabled: !text.trim(), onClick: () => choose('continue') }, t('rerun.continue.go')),
            ),
          ) : h('div', { className: 'ps-rerun' },
            h('div', { className: 'ps-rerun-confirm' + (mode === 'fresh' ? ' danger' : '') },
              mode === 'fresh' ? t('rerun.confirm.fresh') : t('rerun.confirm.continue')),
            mode === 'continue' && text.trim() ? h('div', { className: 'ps-rerun-instruction' },
              h('div', { className: 'ps-rerun-instruction-label' }, t('rerun.instruction.label')),
              str(text)) : null,
            h('div', { className: 'ps-toolbar', style: { marginTop: 18, justifyContent: 'flex-end' } },
              h(psBtn, { ghost: true, onClick: () => setStep('choose') }, t('rerun.back')),
              h(psBtn, { ghost: true, onClick: onClose }, t('rerun.cancel')),
              h(psBtn, { primary: true, className: mode === 'fresh' ? 'ps-rerun-confirm-btn' : '', onClick: confirmRun }, t('rerun.go')),
            ),
          ),
        ),
      ),
    ),
  )
}

async function exportFileBlob(content, format, base) {
  try {
    const res = await fetch('/pomasa/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, format }) })
    if (!res.ok) {
      let msg = t('export.fail')
      try { const j = await res.json(); if (j && j.error) msg = j.error } catch { msg = 'export failed (HTTP ' + res.status + ')' }
      taskManager.setNotice({ kind: 'err', text: msg })
      return
    }
    downloadBlob(await res.blob(), (base || 'pomasa') + '.' + format)
  } catch (e) {
    taskManager.setNotice({ kind: 'err', text: String((e && e.message) || e) || t('export.fail') })
  }
}

export function FileReaderHost() {
  const [file, setFile] = React.useState(null)
  const [viewer, setViewer] = React.useState(null)
  const [rerun, setRerun] = React.useState(null)
  const api = getServices()

  React.useEffect(() => actionBus.on('file.open', (payload) => {
    if (!payload) return
    const hierarchyBase = snapshotHierarchyBase()
    if (payload.kind === 'blueprint') {
      setFile({
        kind: 'blueprint',
        masId: payload.masId,
        path: payload.path,
        title: payload.title,
        stage: payload.stage,
        hierarchyBase,
      })
      setViewer(null)
      return
    }
    if (payload.kind === 'artifact') {
      setFile(null)
      const label = str((payload.entry && (payload.entry.file || payload.entry.path)) || payload.path)
      api.artifact(payload.masId, payload.unitKey || payload.unit, payload.taskKey, payload.path)
        .then((r) => {
          if (r.ok) setViewer({ path: label, content: r.content, format: r.format, hierarchyBase })
          else setViewer({ path: label, content: r.error || t('artifact.read.fail'), format: 'text', hierarchyBase })
        })
        .catch((e) => setViewer({ path: label, content: String(e && e.message || e), format: 'text', hierarchyBase }))
    }
  }), [api])

  React.useEffect(() => actionBus.on('run.choose', (payload) => {
    setRerun(Object.assign({}, payload || {}, { hierarchyBase: snapshotHierarchyBase() }))
  }), [])
  React.useEffect(() => actionBus.on('task.open', () => { setFile(null); setViewer(null) }), [])
  React.useEffect(() => actionBus.on('layout.boot', () => { setFile(null); setViewer(null); setRerun(null) }), [])

  const downloadMd = () => {
    if (!viewer) return
    const blob = new Blob([String(viewer.content)], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, str(viewer.path).split('/').pop() || 'artifact.md')
  }

  return h(React.Fragment, null,
    file && file.kind === 'blueprint'
      ? h(BlueprintModal, {
        api,
        masId: file.masId,
        path: file.path,
        title: file.title,
        stage: file.stage,
        hierarchyBase: file.hierarchyBase,
        onClose: () => setFile(null),
        onExport: exportFileBlob,
      })
      : null,
    viewer
      ? h(ArtifactModal, {
        viewer,
        hierarchyBase: viewer.hierarchyBase,
        onClose: () => { setViewer(null); taskManager.setSelectedArtifact(null) },
        onDownload: downloadMd,
        onExport: exportFileBlob,
      })
      : null,
    rerun
      ? h(RerunModal, {
        unitKey: rerun.unitKey,
        hierarchyBase: rerun.hierarchyBase,
        onClose: () => setRerun(null),
        onRun: async (mode, instruction) => {
          setRerun(null)
          const unitKey = rerun.unitKey || 'default'
          const tid = await taskManager.addTask(unitKey)
          if (!tid) return
          actionBus.emit('run.start', { masId: rerun.masId, unitKey, taskKey: tid, mode, instruction })
        },
      })
      : null,
  )
}
