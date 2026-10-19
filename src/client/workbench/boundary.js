// Error boundary for the workbench subtree.
import { psBtn } from '../buttons/button.js'
import { t } from '../i18n.js'
import { str } from '../util.js'

export function PsBoundary(props) {
  return h(BoundaryImpl, null, props.children ? React.Children.toArray(props.children) : null)
}

class BoundaryImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = { err: null, stack: null, errStack: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  componentDidCatch(err, info) {
    console.error('pomasa-studio render error:', err, info && info.componentStack)
    this.setState({ errStack: err && err.stack })
    if (info && info.componentStack) this.setState({ stack: info.componentStack })
  }
  render() {
    if (this.state.err) {
      return h('div', { className: 'ps-page' },
        h('div', { className: 'ps-notice err' }, t('boundary.fail') + String((this.state.err && this.state.err.message) || this.state.err)),
        this.state.stack
          ? h('pre', { className: 'ps-pre', style: { fontSize: 12, overflow: 'auto', maxHeight: 320 } }, str(this.state.stack))
          : null,
        this.state.errStack
          ? h('pre', { className: 'ps-pre', style: { fontSize: 12, overflow: 'auto', maxHeight: 320 } }, str(this.state.errStack))
          : null,
        h(psBtn, { ghost: true, onClick: () => this.setState({ err: null, stack: null, errStack: null }) }, t('retry')),
      )
    }
    return this.props.children
  }
}
