// Legacy test hook — work layout stands in for the old MasDetail page.
import { WorkLayout } from './layout/work.js'

export function MasDetail() {
  return h(WorkLayout, null)
}

export function WorkPage() {
  return h(WorkLayout, null)
}
