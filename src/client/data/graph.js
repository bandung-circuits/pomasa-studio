const ORCHESTRATOR_KEY = 'orchestrator'
const ORCHESTRATOR_OUTPUT_DIR = '_output'

/** Client-side workflow graph from descriptor (mirrors host/data/graph.js). */
function deriveWorkflowGraph(descriptor) {
  if (!descriptor || !Array.isArray(descriptor.stages)) return { rows: [] }
  const stages = []
  for (const stage of descriptor.stages) {
    if (stage.kind === 'orchestrator') continue
    const agent = stage.agent || stage.agent_file
    if (!agent) continue
    stages.push({
      key: stage.id,
      kind: 'stage',
      title: stage.title || stage.id,
      index: stage.index,
      agent,
      contracts: stage.contracts || [],
    })
  }
  const orchestrator = {
    key: ORCHESTRATOR_KEY,
    kind: 'orchestrator',
    title: 'Orchestrator',
    index: 0,
    agent: 'agents/00.orchestrator.md',
    outputDir: ORCHESTRATOR_OUTPUT_DIR,
    contracts: [],
  }
  const edges = []
  for (let i = 0; i < stages.length - 1; i += 1) {
    edges.push({ from: stages[i].key, to: stages[i + 1].key })
  }
  return { rows: [{ id: 'main', orchestratorKey: ORCHESTRATOR_KEY, orchestrator, stages, edges }] }
}

function workflowRows(descriptor) {
  return deriveWorkflowGraph(descriptor).rows
}

function nodeStageState(tm, node) {
  if (node.key === ORCHESTRATOR_KEY) {
    const run = tm.unitState && tm.unitState.run
    return run ? { status: run.status || 'waiting', artifactCount: 0 } : { status: 'waiting', artifactCount: 0 }
  }
  const stages = (tm.unitState && tm.unitState.stages) || []
  return stages.find((s) => s.id === node.key) || { status: 'waiting', artifactCount: 0, title: node.title }
}
