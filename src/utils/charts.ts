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
    grid: { left: 40, right: 20, top: 56, bottom: 28 },
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
    grid: { left: 40, right: 20, top: 56, bottom: 28 },
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
    grid: { left: 40, right: 20, top: 56, bottom: 28 },
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
    grid: { left: 72, right: 24, top: 56, bottom: 28 },
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
    const point = { value: [Number(r[1]) || 0, Number(r[2]) || 0] as [number, number] }
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
    grid: { left: 48, right: 24, top: 56, bottom: 36 },
    xAxis: { type: 'value', scale: true, splitLine: { show: true } },
    yAxis: { type: 'value', scale: true, splitLine: { show: true } },
    series,
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
}

export function buildChartOption(
  atomName: string,
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  const builder = chartBuilders[atomName] ?? sheetToLineOption
  return builder(sheetData, title)
}
