import ReactECharts from 'echarts-for-react'
import type { AtomContent, EchartTitle } from '../../types/deck'
import { buildChartOption } from '../../utils/charts'
import { useSettingsStore } from '../../store/useSettingsStore'

function titleText(title: unknown): string | undefined {
  if (!title) return undefined
  if (typeof title === 'string') return title
  if (typeof title === 'object' && title !== null) {
    const t = title as EchartTitle
    return t.text ? String(t.text) : undefined
  }
  return undefined
}

/** Shared chart renderer for edit + play (no dual option logic). */
export function ChartAtom({ atomContent }: { atomContent: AtomContent }) {
  // Re-render when global palette changes so option.color updates.
  const chartPaletteId = useSettingsStore((s) => s.chartPaletteId)
  const sheet = (atomContent.detail.sheetData as (string | number)[][]) || []
  const title = titleText(atomContent.detail.title)
  const option = buildChartOption(String(atomContent.atomName), sheet, title)
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        key={chartPaletteId}
        option={option}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
