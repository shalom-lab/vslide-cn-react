import type { AtomContent } from '../../types/deck'

export function TableAtom({ atomContent }: { atomContent: AtomContent }) {
  const sheet = (atomContent.detail.sheetData as (string | number)[][]) || []
  if (!sheet.length) return null
  const [header, ...rows] = sheet
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: 8,
        boxSizing: 'border-box',
      }}
    >
      <table className="atom-table">
        <thead>
          <tr>
            {header.map((c, i) => (
              <th key={i}>{String(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci}>{String(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
