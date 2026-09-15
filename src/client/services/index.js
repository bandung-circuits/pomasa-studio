// Client-side service facade over /pomasa HTTP.
import { createApi } from '../api.js'

let _services = null
export function getServices() {
  if (!_services) _services = createApi()
  return _services
}
function createServices() {
  return getServices()
}
