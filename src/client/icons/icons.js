// SVG icon registry — assets/*.svg inlined at bundle time (esbuild text loader).
import info from '../../../assets/info.svg'
import back from '../../../assets/back.svg'
import settings from '../../../assets/settings.svg'
import blueprint from '../../../assets/blueprint.svg'
import chat from '../../../assets/chat.svg'
import output from '../../../assets/output.svg'
import pomasa from '../../../assets/pomasa.svg'
import send from '../../../assets/send.svg'
import add from '../../../assets/add.svg'
import zoom from '../../../assets/zoom.svg'
import expand from '../../../assets/expand.svg'
import switchIcon from '../../../assets/switch.svg'
import close from '../../../assets/close.svg'

const ICON_SVGS = { info, back, settings, blueprint, chat, output, pomasa, send, add, zoom, expand, switch: switchIcon, close }

function psIconSize(raw, size) {
  return String(raw)
    .replace(/\swidth="24"/, ' width="' + size + '"')
    .replace(/\sheight="24"/, ' height="' + size + '"')
}

export function PsIcon(props) {
  const { name, size = 18, className, title } = props
  const raw = ICON_SVGS[name]
  if (!raw) return null
  const cls = 'ps-icon' + (className ? ' ' + className : '')
  return h('span', {
    className: cls,
    title,
    dangerouslySetInnerHTML: { __html: psIconSize(raw, size) },
    'aria-hidden': title ? undefined : true,
  })
}
