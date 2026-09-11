import fs from 'node:fs'
import path from 'node:path'
import { normalizeAgentPath } from './descriptor.js'

export const ORCHESTRATOR_KEY = 'orchestrator'
export const ORCHESTRATOR_OUTPUT_DIR = '_output'

/** Build workflow rows from a normalized descriptor (one orchestrator row per MAS today). */
export function deriveWorkflowGraph(descriptor, masRoot) {
  if (!descriptor || !Array.isArray(descriptor.stages)) return { rows: [] }
  const orchestratorAgent = findOrchestratorAgent(masRoot)
  const stages = []
  for (const stage of descriptor.stages) {
    if (stage.kind === 'orchestrator') continue
    const agent = normalizeAgentPath(stage.agent || stage.agent_file)
    if (!agent) continue
    if (masRoot && !fs.existsSync(path.join(masRoot, agent))) continue
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

function findOrchestratorAgent(masRoot) {
  if (!masRoot) return 'agents/00.orchestrator.md'
  const agentsDir = path.join(masRoot, 'agents')
  if (!fs.existsSync(agentsDir)) return null
  const found = fs.readdirSync(agentsDir).find((n) => /^00\.orchestrator/i.test(n))
  return found ? path.join('agents', found) : null
}

export function listDeclaredAgents(descriptor, masRoot) {
  const graph = deriveWorkflowGraph(descriptor, masRoot)
  const row = graph.rows[0]
  if (!row) return []
  return [row.orchestrator, ...(row.stages || [])].filter(Boolean)
}
