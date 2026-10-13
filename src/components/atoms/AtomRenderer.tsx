import type { Atom } from '../../types/deck'
import { ChartAtom } from './ChartAtom'
import { ImageAtom } from './ImageAtom'
import { TableAtom } from './TableAtom'
import { TextAtom } from './TextAtom'

export function AtomRenderer({ atom }: { atom: Atom }) {
  const border = atom.atomBorder
  return (
    <div
      className="atom-frame"
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderWidth: border.width,
        borderStyle: border.type,
        borderColor: border.color,
        borderRadius: border.radius,
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {atom.atomType === 'text' && <TextAtom atomContent={atom.atomContent} />}
      {atom.atomType === 'echart' && (
        <ChartAtom atomContent={atom.atomContent} />
      )}
      {atom.atomType === 'tables' && (
        <TableAtom atomContent={atom.atomContent} />
      )}
      {atom.atomType === 'images' && (
        <ImageAtom atomContent={atom.atomContent} />
      )}
    </div>
  )
}
