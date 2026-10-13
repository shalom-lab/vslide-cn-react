import type { CSSProperties, ReactNode } from 'react'
import type { Atom } from '../../types/deck'
import { resolveAtomEntry } from '../../atoms/registry'
import { ChartAtom } from './ChartAtom'
import { ImageAtom } from './ImageAtom'
import { TableAtom } from './TableAtom'
import { TextAtom } from './TextAtom'

/**
 * Single renderer used by Canvas (edit), PlayPage, and SlideList thumbs.
 * Dispatches by atomType; unknown names still render via type fallbacks.
 */
export function AtomRenderer({ atom }: { atom: Atom }) {
  const border = atom.atomBorder
  const entry = resolveAtomEntry(String(atom.atomContent.atomName))
  const atomType = entry?.atomType ?? atom.atomType

  let body: ReactNode = null
  switch (atomType) {
    case 'text':
      body = <TextAtom atomContent={atom.atomContent} />
      break
    case 'echart':
      body = <ChartAtom atomContent={atom.atomContent} />
      break
    case 'tables':
      body = <TableAtom atomContent={atom.atomContent} />
      break
    case 'images':
      body = <ImageAtom atomContent={atom.atomContent} />
      break
    default:
      body = (
        <div className="atom-unknown">
          未知组件: {atom.atomContent.atomName}
        </div>
      )
  }

  return (
    <div
      className="atom-frame"
      data-atom-name={atom.atomContent.atomName}
      data-atom-type={atomType}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderWidth: border.width,
        borderStyle: border.type as CSSProperties['borderStyle'],
        borderColor: border.color,
        borderRadius: border.radius,
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {body}
    </div>
  )
}
