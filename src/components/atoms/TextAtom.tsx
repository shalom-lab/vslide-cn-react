import MarkdownIt from 'markdown-it'
import type { AtomContent } from '../../types/deck'

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

export function TextAtom({ atomContent }: { atomContent: AtomContent }) {
  const d = atomContent.detail

  if (atomContent.atomName === 'text-shadow') {
    const shadow = (d.shadow as { h?: number; v?: number; blur?: number; color?: string }) || {}
    const textShadow = `${Number(shadow.h) || 0}px ${Number(shadow.v) || 0}px ${Number(shadow.blur) || 0}px ${shadow.color || 'transparent'}`
    return (
      <div
        className="atom-text-shadow"
        style={{
          fontSize: Number(d.fontSize) || 28,
          fontWeight: (d.fontWeight as number | string) || 900,
          fontFamily: String(d.fontFamily || 'Arial'),
          color: String(d.color || '#2c3e50'),
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
        {String(d.text ?? '')}
      </div>
    )
  }

  // text-md (and legacy text-title if any slipped through unnormalized)
  const markdown =
    typeof d.markdown === 'string'
      ? d.markdown
      : typeof d.text === 'string'
        ? String(d.text)
        : ''
  const html = md.render(markdown)
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
