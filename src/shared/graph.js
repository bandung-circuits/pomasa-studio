// Shared workflow graph derivation (host + client). Environment capabilities
// are injected so the module stays runtime-agnostic:
// - exists(agent): blueprint file presence check (host: fs; client: () => true)
// - resolveOrchestrator(): orchestrator blueprint path or null
//   (host: readdir probe of agents/; client: default 'agents/00.orchestrator.md')
// Descriptors are expected normalized (host data/descriptor.js loadDescriptor).

export const ORCHESTRATOR_KEY = 'orchestrator'
export const ORCHESTRATOR_OUTPUT_DIR = '_output'
const DEFAULT_ORCHESTRATOR_AGENT = 'agents/00.orchestrator.md'

export function deriveWorkflowGraph(descriptor, opts) {
  const options = opts || {}
  const exists = typeof options.exists === 'function' ? options.exists : () => true
  const resolveOrchestrator = typeof options.resolveOrchestrator === 'function'
    ? options.resolveOrchestrator
    : () => DEFAULT_ORCHESTRATOR_AGENT
  if (!descriptor || !Array.isArray(descriptor.stages)) return { rows: [] }
  const orchestratorAgent = resolveOrchestrator()
  const stages = []
  for (const stage of descriptor.stages) {
    if (stage.kind === 'orchestrator') continue
    const agent = stage.agent || stage.agent_file
    if (!agent) continue
    if (!exists(agent)) continue
    stages.push({
      key: stage.id,
      kind: 'stage',
      title: stage.title || stage.id,
      index: stage.index,
      agent,
      contracts: stage.contracts || [],
    })
  }
  const orchestrator = orchestratorAgent ? {
    key: ORCHESTRATOR_KEY,
    kind: 'orchestrator',
    title: 'Orchestrator',
    index: 0,
    agent: orchestratorAgent,
    outputDir: ORCHESTRATOR_OUTPUT_DIR,
    contracts: [],
  } : null
  const edges = []
  for (let i = 0; i < stages.length - 1; i += 1) {
    edges.push({ from: stages[i].key, to: stages[i + 1].key })
  }
  return { rows: [{ id: 'main', orchestratorKey: ORCHESTRATOR_KEY, orchestrator, stages, edges }] }
}

export function listDeclaredAgents(descriptor, opts) {
  const graph = deriveWorkflowGraph(descriptor, opts)
  const row = graph.rows[0]
  if (!row) return []
  return [row.orchestrator, ...(row.stages || [])].filter(Boolean)
}
