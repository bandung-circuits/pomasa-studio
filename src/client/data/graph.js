// Client-side workflow graph — thin wrapper over src/shared/graph.js
// (client has no fs: all declared agents assumed present, default orchestrator path).
import { deriveWorkflowGraph, ORCHESTRATOR_KEY } from '../../shared/graph.js'

export function workflowRows(descriptor) {
  return deriveWorkflowGraph(descriptor).rows
}

export function nodeStageState(tm, node) {
  if (node.key === ORCHESTRATOR_KEY) {
    const run = tm.unitState && tm.unitState.run
    return run ? { status: run.status || 'waiting', artifactCount: 0 } : { status: 'waiting', artifactCount: 0 }
  }
  const stages = (tm.unitState && tm.unitState.stages) || []
  return stages.find((s) => s.id === node.key) || { status: 'waiting', artifactCount: 0, title: node.title }
}
