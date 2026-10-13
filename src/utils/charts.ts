import type { EChartsOption } from 'echarts'
import { getActiveChartColors } from '../store/useSettingsStore'

function titleOpt(title?: string) {
  return title
    ? { text: title, left: 'center', textStyle: { fontSize: 14 } }
    : undefined
}

function axisSheet(sheetData: (string | number)[][]) {
  const header = sheetData[0]
  const categories = sheetData.slice(1).map((r) => String(r[0]))
  return { header, categories }
}

/**
 * Vue-aligned grid: percentage insets + containLabel so the plot fills the
 * atom box at any size (fixed px margins left huge empty regions when the
 * container was taller/wider than the default chart draft size).
 */
function chartGrid(
  extra?: Partial<{ left: string; right: string; top: string; bottom: string }>,
) {
  return {
    containLabel: true,
    left: extra?.left ?? '4%',
    right: extra?.right ?? '4%',
    top: extra?.top ?? '18%',
    bottom: extra?.bottom ?? '8%',
  }
}

/** sheetData: first row = series names (col0 = category header), rest = rows */
export function sheetToLineOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const { header, categories } = axisSheet(sheetData)
  const series = header.slice(1).map((name, si) => ({
    name: String(name),
    type: 'line' as const,
    smooth: false,
    data: sheetData.slice(1).map((r) => Number(r[si + 1]) || 0),
    areaStyle: { opacity: 0.15 },
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'axis' },
    legend: { top: 24 },
    grid: chartGrid(),
    xAxis: { type: 'category', data: categories, boundaryGap: false },
    yAxis: { type: 'value' },
    series,
  }
}

export function sheetToBarOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const { header, categories } = axisSheet(sheetData)
  const series = header.slice(1).map((name, si) => ({
    name: String(name),
    type: 'bar' as const,
    data: sheetData.slice(1).map((r) => Number(r[si + 1]) || 0),
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'axis' },
    legend: { top: 24 },
    grid: chartGrid(),
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series,
  }
}

/** stack-bar: same sheet layout, series share stack id */
export function sheetToStackBarOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const { header, categories } = axisSheet(sheetData)
  const series = header.slice(1).map((name, si) => ({
    name: String(name),
    type: 'bar' as const,
    stack: 'total',
    emphasis: { focus: 'series' as const },
    data: sheetData.slice(1).map((r) => Number(r[si + 1]) || 0),
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'axis' },
    legend: { top: 24 },
    grid: chartGrid(),
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series,
  }
}

/** hor-bar: swap axes — categories on Y */
export function sheetToHorBarOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const { header, categories } = axisSheet(sheetData)
  const series = header.slice(1).map((name, si) => ({
    name: String(name),
    type: 'bar' as const,
    data: sheetData.slice(1).map((r) => Number(r[si + 1]) || 0),
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 24 },
    // Extra left room for category labels; containLabel keeps plot filling
    grid: chartGrid({ left: '3%', top: '16%', bottom: '6%' }),
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: categories },
    series,
  }
}

export function sheetToPieOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const data = sheetData.slice(1).map((r) => ({
    name: String(r[0]),
    value: Number(r[1]) || 0,
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'item' },
    legend: { top: 24 },
    series: [
      {
        type: 'pie',
        radius: ['30%', '65%'],
        center: ['50%', '58%'],
        data,
        label: { formatter: '{b}: {d}%' },
      },
    ],
  }
}

/**
 * simple-scatter sheet: [组别, x, y] rows.
 * Groups by col0 → one scatter series per group.
 */
export function sheetToScatterOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const rows = sheetData.slice(1)
  const groups = new Map<string, { value: [number, number] }[]>()
  for (const r of rows) {
    const name = String(r[0] ?? '')
    const point = {
      value: [Number(r[1]) || 0, Number(r[2]) || 0] as [number, number],
    }
    const list = groups.get(name) ?? []
    list.push(point)
    groups.set(name, list)
  }
  const series = [...groups.entries()].map(([name, data]) => ({
    name,
    type: 'scatter' as const,
    symbolSize: 14,
    data,
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const item = p as { seriesName?: string; value?: number[] }
        const v = item.value ?? []
        return `${item.seriesName ?? ''}<br/>x: ${v[0]} · y: ${v[1]}`
      },
    },
    legend: { top: 24 },
    grid: chartGrid({ bottom: '10%' }),
    xAxis: { type: 'value', scale: true, splitLine: { show: true } },
    yAxis: { type: 'value', scale: true, splitLine: { show: true } },
    series,
  }
}

/** simple-radar sheet: row0 headers, row1 mins, row2 maxes, rest = series values */
export function sheetToRadarOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length || sheetData.length < 3) return {}
  const header = sheetData[0] ?? []
  const mins = sheetData[1] ?? []
  const maxs = sheetData[2] ?? []
  const indicator = header.slice(1).map((name, i) => ({
    name: String(name),
    min: Number(mins[i + 1]) || 0,
    max: Number(maxs[i + 1]) || 100,
  }))
  const seriesData = sheetData.slice(3).map((row) => ({
    name: String(row[0] ?? ''),
    value: row.slice(1).map((v) => Number(v) || 0),
  }))
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'item' },
    legend: { top: 24 },
    radar: {
      indicator,
      center: ['50%', '58%'],
      radius: '62%',
      shape: 'polygon',
      splitNumber: 5,
    },
    series: [
      {
        type: 'radar',
        data: seriesData,
        areaStyle: { opacity: 0.15 },
        symbol: 'circle',
        symbolSize: 5,
      },
    ],
  }
}

/** simple-funnel sheet: [name, value] rows (no header required; skip header-like first row if col1 is non-numeric) */
export function sheetToFunnelOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  let rows = sheetData
  const firstVal = Number(sheetData[0]?.[1])
  if (Number.isNaN(firstVal) && sheetData.length > 1) {
    rows = sheetData.slice(1)
  }
  const data = rows.map((r) => ({
    name: String(r[0] ?? ''),
    value: Number(r[1]) || 0,
  }))
  const max = Math.max(...data.map((d) => d.value), 1)
  return {
    color: getActiveChartColors(),
    title: titleOpt(title),
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    legend: { top: 24 },
    series: [
      {
        type: 'funnel',
        left: '10%',
        right: '10%',
        top: '18%',
        bottom: '8%',
        min: 0,
        max,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside' },
        data,
      },
    ],
  }
}

export type ChartOptionBuilder = (
  sheetData: (string | number)[][],
  title?: string,
) => EChartsOption

/** atomName → option builder (aliases map to same builder) */
export const chartBuilders: Record<string, ChartOptionBuilder> = {
  'simple-line': sheetToLineOption,
  'line-zoom': sheetToLineOption,
  'simple-bar': sheetToBarOption,
  'multi-bar': sheetToBarOption,
  'stack-bar': sheetToStackBarOption,
  'hor-bar': sheetToHorBarOption,
  'hor-stack': sheetToStackBarOption, // closest: stacked; hor-stack full later
  'simple-pie': sheetToPieOption,
  'simple-scatter': sheetToScatterOption,
  'simple-bubble': sheetToScatterOption,
  'simple-radar': sheetToRadarOption,
  'simple-funnel': sheetToFunnelOption,
}

export function buildChartOption(
  atomName: string,
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  const builder = chartBuilders[atomName] ?? sheetToLineOption
  return builder(sheetData, title)
}

