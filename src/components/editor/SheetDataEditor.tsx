import { useCallback, useEffect, useMemo, useRef } from 'react'
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

function sheetKey(sheetData: unknown): string {
  try {
    return JSON.stringify(sheetData)
  } catch {
    return ''
  }
}

/**
 * Handsontable spreadsheet for atom sheetData (charts / tables).
 * Mirrors vslide-vue Edit/Share/SheetData.vue — drag-edit cells, spare rows/cols.
 */
export function SheetDataEditor({ data, onChange, focused }: Props) {
  const hotRef = useRef<HotTableRef>(null)
  const lastEmitted = useRef<string>(sheetKey(data))
  const sheet = useMemo(() => normalizeSheet(data), [data])

  useEffect(() => {
    lastEmitted.current = sheetKey(data)
  }, [data])

  const emitFromHot = useCallback(() => {
    const hot = hotRef.current?.hotInstance
    // Guard destroyed / half-mounted instances (canvas resize / selection remounts)
    if (!hot || hot.isDestroyed || !hot.table) return
    let nr: number
    let nc: number
    try {
      nr = hot.countRows() - hot.countEmptyRows(true)
      nc = hot.countCols() - hot.countEmptyCols(true)
    } catch {
      return
    }
    if (nr + nc === 0) return
    let raw: Cell[][]
    try {
      raw = hot.getData(
        0,
        0,
        Math.max(0, nr - 1),
        Math.max(0, nc - 1),
      ) as Cell[][]
    } catch {
      return
    }
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
    const key = sheetKey(sheetData)
    // Skip no-op emits (spare row/col auto-create would otherwise loop setState)
    if (key === lastEmitted.current) return
    lastEmitted.current = key
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
          // minSpareRows/Cols fire source "auto" — ignore to avoid update loops
          afterCreateCol={(_i, _n, source) => {
            if (source === 'auto') return
            emitFromHot()
          }}
          afterCreateRow={(_i, _n, source) => {
            if (source === 'auto') return
            emitFromHot()
          }}
        />
      </div>
    </div>
  )
}
