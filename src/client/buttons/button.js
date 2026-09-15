// Unified button UI — text/icon × dark/light; named presets via registerButton.
import { t } from '../i18n.js'
import { PsIcon } from '../icons/icons.js'

const buttonRegistry = new Map()

function registerButton(id, spec) {
  if (!id || !spec) return
  buttonRegistry.set(id, spec)
}

function resolveButtonProps(props, children) {
  const p = props || {}
  let spec = p.id ? buttonRegistry.get(p.id) : null
  if (spec) spec = typeof spec === 'function' ? spec() : spec
  const merged = Object.assign({}, spec, p)
  delete merged.id
  if (children !== undefined && children !== null && !(typeof children === 'object' && !Array.isArray(children) && !children.$$typeof && Object.keys(children).length === 0)) {
    merged.children = children
  } else if (p.children !== undefined) {
    merged.children = p.children
  }
  return merged
}

function psButtonClassName(kind, tone, ghost, extra) {
  const cls = ['ps-ui-btn', 'ps-btn']
  if (kind === 'icon') cls.push('ps-ui-btn--icon', 'ps-icon-btn')
  else cls.push('ps-ui-btn--text')
  if (tone === 'dark') cls.push('ps-ui-btn--dark')
  else cls.push('ps-ui-btn--light')
  if (ghost) cls.push('ghost')
  else if (tone === 'dark' && kind === 'text') cls.push('primary')
  if (extra) cls.push(extra)
  return cls.join(' ')
}

export function PsButton(props, children) {
  const p = resolveButtonProps(props, children)
  const kind = p.kind || 'text'
  const tone = p.tone || 'light'
  const ghost = !!p.ghost
  const icon = p.icon
  const size = p.size || (kind === 'icon' && tone === 'dark' ? 16 : 18)
  const ariaRaw = p.title != null ? p.title : (p.label != null ? p.label : p['aria-label'])
  const aria = typeof ariaRaw === 'function' ? ariaRaw() : ariaRaw
  const cls = psButtonClassName(kind, tone, ghost, p.className)
  const rest = Object.assign({}, p)
  ;['kind', 'tone', 'ghost', 'icon', 'size', 'title', 'label', 'className', 'children'].forEach((k) => { delete rest[k] })

  let body = p.children
  if (body === undefined || body === null) {
    if (kind === 'icon' && icon) body = h(PsIcon, { name: icon, size })
    else body = null
  }

  return h('button', Object.assign({}, rest, {
    type: rest.type || 'button',
    className: cls,
    title: aria,
    'aria-label': aria || undefined,
  }), body)
}

export function psBtn(props, children) {
  const p = props || {}
  if (p.ghost) {
    return PsButton(Object.assign({}, p, { kind: 'text', ghost: true }), children)
  }
  return PsButton(Object.assign({}, p, {
    kind: 'text',
    tone: p.primary ? 'dark' : 'light',
  }), children)
}

export function psIconBtn(props) {
  const p = props || {}
  return PsButton(Object.assign({}, p, {
    kind: 'icon',
    tone: p.tone || 'light',
  }))
}

registerButton('send', {
  kind: 'icon',
  tone: 'dark',
  icon: 'send',
  size: 16,
  title: () => t('chat.send'),
})

registerButton('add', {
  kind: 'icon',
  tone: 'light',
  ghost: true,
  icon: 'add',
  size: 16,
})

registerButton('zoom', {
  kind: 'icon',
  tone: 'light',
  ghost: true,
  icon: 'zoom',
  size: 16,
})

registerButton('expand', {
  kind: 'icon',
  tone: 'light',
  ghost: true,
  icon: 'expand',
  size: 16,
  title: () => t('nodes.expand'),
})
