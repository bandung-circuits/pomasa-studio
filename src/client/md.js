// Markdown rendering for the artifact viewer, via markdown-it +
// markdown-it-footnote (the same engine Auctor ships). scripts/md-api.mjs
// is esbuild-bundled into the client as the __psMd global by
// scripts/bundle-client.mjs; html: false keeps raw HTML escaped, so artifact
// content cannot inject markup. Footnotes render into a labelled block.
let _md = null
let _hidx = 0
function getMd() {
  if (_md) return _md
  if (typeof __psMd === 'undefined' || !__psMd.createMarkdown) return null
  const md = __psMd.createMarkdown()
  const esc = (s) => md.utils.escapeHtml(String(s))
  // Headings 1–4 carry a running index (data-h) so a later TOC can jump,
  // mirroring Auctor.
  md.renderer.rules.heading_open = (tokens, idx) => {
    const tok = tokens[idx]
    const level = Number(tok.tag.slice(1)) || 1
    if (level <= 4) {
      _hidx += 1
      return `<${tok.tag} data-h="h${_hidx}">`
    }
    return `<${tok.tag}>`
  }
  // Fenced code keeps the Studio pre/code shapes (ps-pre / lang-*).
  md.renderer.rules.fence = (tokens, idx) => {
    const tok = tokens[idx]
    const lang = tok.info ? tok.info.trim().split(/\s+/)[0] : ''
    return '<pre class="ps-pre"><code' + (lang ? ' class="lang-' + lang + '"' : '') + '>' + esc(tok.content) + '</code></pre>\n'
  }
  // Inline code keeps the ps-code chip shape.
  md.renderer.rules.code_inline = (tokens, idx) => '<code class="ps-code">' + esc(tokens[idx].content) + '</code>'
  // Links open in a new tab, same as the previous renderer.
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noreferrer')
    return self.renderToken(tokens, idx, options)
  }
  // The footnote block gets a labelled heading (markdown-it-footnote's default
  // <hr class="footnotes-sep"> is dropped in favour of the titled block).
  md.renderer.rules.footnote_block_open = () =>
    '<div class="ps-md-footnotes-title">' + esc(t('footnotes')) + '</div>\n<section class="footnotes">\n<ol class="footnotes-list">'
  md.renderer.rules.footnote_block_close = () => '</ol>\n</section>\n'
  _md = md
  return md
}

function renderMarkdown(md) {
  const engine = getMd()
  let html
  if (engine) {
    _hidx = 0
    html = engine.render(String(md == null ? '' : md))
  } else {
    // No engine available (unbundled dev): render as escaped plain text.
    html = '<p>' + String(md == null ? '' : md).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>'
  }
  return h('div', { className: 'ps-md', dangerouslySetInnerHTML: { __html: html } })
}