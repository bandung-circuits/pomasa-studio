import fs from 'node:fs'
import path from 'node:path'
import * as fsx from '../file-system/index.js'
import { loadDescriptor } from '../data/descriptor.js'
import { loadRegistry, saveRegistry } from './registry.js'
import { masDir, pomasaHome } from '../paths/index.js'

export function createMasManager(deps) {
  const { config, home, sessions, creator } = deps

  function isRegistered(masId) {
    return loadRegistry(config).mas.some((m) => m.id === masId)
  }

  function hasMas(masId) {
    if (!masId || !isRegistered(masId)) return false
    const root = masDir(home(), masId)
    return fs.existsSync(root) && !fsx.isHidden(root)
  }

  async function listMas() {
    const reg = loadRegistry(config)
    const list = []
    for (const m of reg.mas) {
      if (!fs.existsSync(masDir(home(), m.id))) continue
      if (fsx.isHidden(masDir(home(), m.id))) continue
      list.push(await creator.masSummary(m))
    }
    return { ok: true, mas: list }
  }

  function getMas(masId) {
    if (!hasMas(masId)) return { ok: false, code: 404, error: 'no such mas' }
    const descriptor = loadDescriptor(masDir(home(), masId))
    return {
      ok: true,
      descriptor,
      generated: creator.isGenerationComplete(masId),
    }
  }

  function deleteMas(masId, opts = {}) {
    const permanent = opts.permanent === true
    if (!hasMas(masId) && !(permanent && fs.existsSync(masDir(home(), masId)))) {
      return { ok: false, code: 404, error: 'no such mas' }
    }
    sessions.clearMasSessions(masId)
    const root = masDir(home(), masId)
    if (permanent) {
      fsx.remove(root, { recursive: true })
    } else {
      fsx.markHidden(root, { kind: 'mas', masId })
    }
    const reg = loadRegistry(config)
    reg.mas = reg.mas.filter((m) => m.id !== masId)
    saveRegistry(config, reg)
    return { ok: true, permanent }
  }

  function meta() {
    const sessionsList = []
    for (const m of loadRegistry(config).mas) {
      if (fsx.isHidden(masDir(home(), m.id))) continue
      if (m.lastGenSessionId) sessionsList.push(m.lastGenSessionId)
      for (const sid of Object.values(m.lastRunSessionIds || {})) if (sid) sessionsList.push(sid)
    }
    return { ok: true, home: home(), sessions: sessionsList }
  }

  return {
    isRegistered,
    hasMas,
    listMas,
    getMas,
    deleteMas,
    meta,
    loadRegistry,
    saveRegistry,
  }
}
