// Legacy test hook — work layout stands in for the old MasDetail page.
import { WorkLayout } from './layout/work.js'

function MasDetail() {
  return h(WorkLayout, null)
}

function WorkPage() {
  return h(WorkLayout, null)
}
