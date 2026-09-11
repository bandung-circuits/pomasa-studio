/** Stable DSH session ids for POMASA run agents (must match [A-Za-z0-9._-]). */
export function agentSessionId(masId, unitKey, taskKey, agentKey) {
  const safe = (s) => String(s || '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return [
    'pomasa',
    safe(masId),
    safe(unitKey || 'default'),
    safe(taskKey || 'legacy'),
    safe(agentKey || 'agent'),
  ].join('.')
}
