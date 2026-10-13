import MarkdownIt from 'markdown-it'
import type { AtomContent } from '../../types/deck'

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

export function TextAtom({ atomContent }: { atomContent: AtomContent }) {
  const d = atomContent.detail
  if (atomContent.atomName === 'text-title') {
    return (
      <div
        className="atom-text-title"
        style={{
          fontSize: Number(d.fontSize) || 28,
          fontWeight: (d.fontWeight as number) || 600,
          color: String(d.color || '#2c3e50'),
          textAlign: (d.align as CanvasTextAlign) || 'left',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            d.align === 'center'
              ? 'center'
              : d.align === 'right'
                ? 'flex-end'
                : 'flex-start',
          padding: '4px 8px',
          boxSizing: 'border-box',
        }}
      >
        {String(d.text ?? '')}
      </div>
    )
  }
  const html = md.render(String(d.markdown ?? ''))
  return (
    <div
      className="atom-text-md"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '8px 12px',
        boxSizing: 'border-box',
        textAlign: 'left',
        fontSize: 14,
        lineHeight: 1.55,
        color: '#2c3e50',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
