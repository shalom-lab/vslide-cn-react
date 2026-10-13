import type { CSSProperties } from 'react'
import type { AtomContent } from '../../types/deck'
import { resolveTableFormat } from '../../types/deck'

export function TableAtom({ atomContent }: { atomContent: AtomContent }) {
  const sheet = (atomContent.detail.sheetData as (string | number)[][]) || []
  if (!sheet.length) return null

  const fmt = resolveTableFormat(atomContent.detail)
  const hasHeader = fmt.headerRow && sheet.length > 0
  const header = hasHeader ? sheet[0] : null
  const rows = hasHeader ? sheet.slice(1) : sheet

  const border = `${fmt.borderWidth}px solid ${fmt.borderColor}`
  const cellPad: CSSProperties = {
    border,
    padding: '0.4em 0.65em',
    textAlign: fmt.cellAlign,
  }

  return (
    <div
      className="atom-table-wrap"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '0.5rem',
        boxSizing: 'border-box',
      }}
    >
      <table
        className={
          'atom-table' + (fmt.zebra ? ' atom-table--zebra' : '')
        }
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.92rem',
        }}
      >
        {header ? (
          <thead>
            <tr>
              {header.map((c, i) => (
                <th
                  key={i}
                  style={{
                    ...cellPad,
                    background: fmt.headerBackground,
                    fontWeight: fmt.boldHeader ? 600 : 400,
                  }}
                >
                  {String(c)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci} style={cellPad}>
                  {String(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
