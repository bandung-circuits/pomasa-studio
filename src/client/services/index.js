// Client-side service facade over /pomasa HTTP.

let _services = null
function getServices() {
  if (!_services) _services = createApi()
  return _services
}
function createServices() {
  return getServices()
}
