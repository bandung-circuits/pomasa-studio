import fs from 'node:fs'
import * as fsx from '../file-system/index.js'
import { pomasaHome, registryPath } from '../paths/index.js'

export function loadRegistry(config) {
  const file = registryPath(pomasaHome(config))
  if (!fs.existsSync(file)) return { version: 1, mas: [] }
  try {
    return JSON.parse(fsx.read(file))
  } catch {
    return { version: 1, mas: [] }
  }
}

export function saveRegistry(config, reg) {
  fsx.write(registryPath(pomasaHome(config)), JSON.stringify(reg, null, 2) + '\n')
}

export function upsertMas(config, patch) {
  const reg = loadRegistry(config)
  const i = reg.mas.findIndex((m) => m.id === patch.id)
  if (i >= 0) reg.mas[i] = { ...reg.mas[i], ...patch }
  else reg.mas.unshift({ id: patch.id, status: 'idle', createdAt: Date.now(), ...patch })
  saveRegistry(config, reg)
  return reg.mas.find((m) => m.id === patch.id)
}