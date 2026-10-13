import { useCallback, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsType } from 'echarts'
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

/**
 * Shared chart renderer for edit + play (no dual option logic).
 * Uses ResizeObserver + chart.resize so the canvas tracks atom box size
 * (echarts-for-react autoResize skips the first size-sensor callback, which
 * leaves charts stuck at a tiny height after RGL layout / atom resize).
 */
export function ChartAtom({ atomContent }: { atomContent: AtomContent }) {
  // Re-render when global palette changes so option.color updates.
  const chartPaletteId = useSettingsStore((s) => s.chartPaletteId)
  const sheet = (atomContent.detail.sheetData as (string | number)[][]) || []
  const title = titleText(atomContent.detail.title)
  const option = buildChartOption(String(atomContent.atomName), sheet, title)

  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<InstanceType<typeof ReactECharts> | null>(null)

  const resizeChart = useCallback(() => {
    const inst = chartRef.current?.getEchartsInstance?.() as
      | EChartsType
      | undefined
    if (!inst) return
    try {
      inst.resize({ width: 'auto', height: 'auto' })
    } catch {
      /* chart disposed */
    }
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      // rAF: wait for RGL/layout to commit pixel size before measuring
      requestAnimationFrame(resizeChart)
    })
    ro.observe(el)
    // Immediate + next-frame pass covers mount-before-layout
    resizeChart()
    const raf = requestAnimationFrame(resizeChart)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [resizeChart, chartPaletteId])

  return (
    <div
      ref={wrapRef}
      className="chart-atom"
      style={{ width: '100%', height: '100%', minHeight: 0, minWidth: 0 }}
    >
      <ReactECharts
        ref={chartRef}
        key={chartPaletteId}
        option={option}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
        autoResize={false}
        onChartReady={resizeChart}
      />
    </div>
  )
}
