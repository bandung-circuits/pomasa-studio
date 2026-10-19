import fs from 'node:fs'
import path from 'node:path'
import { deriveWorkflowGraph as deriveGraph, listDeclaredAgents as listAgents, ORCHESTRATOR_KEY, ORCHESTRATOR_OUTPUT_DIR } from '../../shared/graph.js'

export { ORCHESTRATOR_KEY, ORCHESTRATOR_OUTPUT_DIR }

function hostGraphOpts(masRoot) {
  return {
    exists: masRoot ? (agent) => fs.existsSync(path.join(masRoot, agent)) : () => true,
    resolveOrchestrator: () => findOrchestratorAgent(masRoot),
  }
}

/** Build workflow rows from a normalized descriptor (one orchestrator row per MAS today). */
export function deriveWorkflowGraph(descriptor, masRoot) {
  return deriveGraph(descriptor, hostGraphOpts(masRoot))
}

export function listDeclaredAgents(descriptor, masRoot) {
  return listAgents(descriptor, hostGraphOpts(masRoot))
}

function findOrchestratorAgent(masRoot) {
  if (!masRoot) return 'agents/00.orchestrator.md'
  const agentsDir = path.join(masRoot, 'agents')
  if (!fs.existsSync(agentsDir)) return null
  const found = fs.readdirSync(agentsDir).find((n) => /^00\.orchestrator/i.test(n))
  return found ? path.join('agents', found) : null
}
