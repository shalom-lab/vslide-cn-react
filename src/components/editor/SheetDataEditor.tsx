import { useCallback, useMemo, useRef } from 'react'
import { HotTable } from '@handsontable/react-wrapper'
import { registerAllModules } from 'handsontable/registry'
import type { HotTableRef } from '@handsontable/react-wrapper'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'

registerAllModules()

type Cell = string | number | boolean | null

interface Props {
  data: Cell[][]
  onChange: (sheetData: (string | number)[][], nr: number, nc: number) => void
  /** Highlight when context menu focuses sheetData */
  focused?: boolean
}

function normalizeSheet(raw: unknown): Cell[][] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ]
  }
  return raw.map((row) =>
    Array.isArray(row) ? (row as Cell[]) : [row as Cell],
  )
}

/**
 * Handsontable spreadsheet for atom sheetData (charts / tables).
 * Mirrors vslide-vue Edit/Share/SheetData.vue — drag-edit cells, spare rows/cols.
 */
export function SheetDataEditor({ data, onChange, focused }: Props) {
  const hotRef = useRef<HotTableRef>(null)
  const sheet = useMemo(() => normalizeSheet(data), [data])

  const emitFromHot = useCallback(() => {
    const hot = hotRef.current?.hotInstance
    if (!hot) return
    const nr = hot.countRows() - hot.countEmptyRows(true)
    const nc = hot.countCols() - hot.countEmptyCols(true)
    if (nr + nc === 0) return
    const raw = hot.getData(0, 0, Math.max(0, nr - 1), Math.max(0, nc - 1))
    const sheetData = (JSON.parse(JSON.stringify(raw)) as Cell[][]).map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return ''
        if (typeof cell === 'number') return cell
        const s = String(cell)
        const n = Number(s)
        if (s !== '' && !Number.isNaN(n) && String(n) === s.trim()) return n
        return s
      }),
    ) as (string | number)[][]
    onChange(sheetData, nr, nc)
  }, [onChange])

  return (
    <div
      className={
        'sheet-data-editor' + (focused ? ' focus-flash' : '')
      }
    >
      <div className="sheet-data-toolbar">
        <span className="sheet-data-title">数据表</span>
        <span className="hint">双击编辑 · 右键行列 · 空行/列自动裁剪</span>
      </div>
      <div className="sheet-data-hot ht-theme-main">
        <HotTable
          ref={hotRef}
          data={sheet}
          rowHeaders
          colHeaders
          height="auto"
          width="100%"
          stretchH="all"
          manualRowResize
          manualColumnResize
          contextMenu
          filters={false}
          dropdownMenu={false}
          columnSorting={false}
          fixedRowsTop={1}
          minSpareRows={3}
          minSpareCols={2}
          licenseKey="non-commercial-and-evaluation"
          afterChange={(_changes, source) => {
            if (source === 'loadData') return
            emitFromHot()
          }}
          afterRemoveCol={() => emitFromHot()}
          afterRemoveRow={() => emitFromHot()}
          afterCreateCol={() => emitFromHot()}
          afterCreateRow={() => emitFromHot()}
        />
      </div>
    </div>
  )
}
