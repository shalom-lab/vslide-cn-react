import { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import markdownItKatex from '@traptitech/markdown-it-katex'
import type { AtomContent } from '../../types/deck'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

const md = new MarkdownIt({
  html: true, // allow embedded HTML; sanitized before render
  linkify: true,
  breaks: true,
})
md.use(markdownItKatex, {
  throwOnError: false,
  errorColor: '#cc0000',
  // HTML-only so DOMPurify need not allow MathML tags
  output: 'html',
})

const DEFAULT_MD_SAMPLE = `## Markdown 示例

支持 **粗体**、*斜体*、\`代码\`、列表与表格。

- 行内公式：$E = mc^2$
- 块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

> 渲染经 DOMPurify 消毒，不执行 JavaScript。
`

export function defaultMarkdownSample(): string {
  return DEFAULT_MD_SAMPLE
}

function TextShadowView({ detail }: { detail: Record<string, unknown> }) {
  const shadow =
    (detail.shadow as {
      h?: number
      v?: number
      blur?: number
      color?: string
    }) || {}
  const textShadow = `${Number(shadow.h) || 0}px ${Number(shadow.v) || 0}px ${Number(shadow.blur) || 0}px ${shadow.color || 'transparent'}`
  return (
    <div
      className="atom-text-shadow"
      style={{
        fontSize: Number(detail.fontSize) || 28,
        fontWeight: (detail.fontWeight as number | string) || 900,
        fontFamily: String(detail.fontFamily || 'Arial'),
        color: String(detail.color || '#2c3e50'),
        textShadow,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 8px',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      {String(detail.text ?? '')}
    </div>
  )
}

function TextMdView({ detail }: { detail: Record<string, unknown> }) {
  const markdown =
    typeof detail.markdown === 'string'
      ? detail.markdown
      : typeof detail.text === 'string'
        ? String(detail.text)
        : ''

  const html = useMemo(() => sanitizeHtml(md.render(markdown)), [markdown])

  return (
    <div
      className="atom-text-md atom-prose"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '8px 12px',
        boxSizing: 'border-box',
        textAlign: 'left',
        fontSize: 14,
        lineHeight: 1.6,
        color: '#2c3e50',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function TextAtom({ atomContent }: { atomContent: AtomContent }) {
  if (atomContent.atomName === 'text-shadow') {
    return <TextShadowView detail={atomContent.detail} />
  }
  return <TextMdView detail={atomContent.detail} />
}
