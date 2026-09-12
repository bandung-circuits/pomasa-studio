// Client Markdown engine (markdown-it + markdown-it-footnote), bundled into
// the client as the __psMd global by scripts/bundle-client.mjs (esbuild).
// html: false — raw HTML is escaped, so rendered artifact content cannot
// inject markup. Mirrors the Auctor client engine (scripts/md-api.mjs there).
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'

export function createMarkdown() {
  const md = new MarkdownIt({
    html: false,       // 原始 HTML 一律转义，杜绝 XSS
    linkify: false,
    typographer: false,
  })
  md.use(footnote)
  return md
}