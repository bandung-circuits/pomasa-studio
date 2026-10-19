import { ensurePomasaHome } from './bootstrap.js'

/** Seed ~/.pomasa from the checked-in template on startup. */
export function bootstrapRuntime(config = {}) {
  return ensurePomasaHome(config)
}

export { ensurePomasaHome, templatePomasaHome } from './bootstrap.js'
