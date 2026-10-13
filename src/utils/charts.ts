import type { EChartsOption } from 'echarts'

const palette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']

/** sheetData: first row = series names (col0 = category header), rest = rows */
export function sheetToLineOption(
  sheetData: (string | number)[][],
  title?: string,
): EChartsOption {
  if (!sheetData?.length) return {}
  const header = sheetData[0]
  const categories = sheetData.slice(1).map((r) => String(r[0]))
  const series = header.slice(1).map((name, si) => ({
    name: String(name),
    type: 'line' as const,
    smooth: false,
    data: sheetData.slice(1).map((r) => Number(r[si + 1]) || 0),
    areaStyle: { opacity: 0.15 },
  }))
  return {
    color: palette,
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 14 } } : undefined,
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
  const header = sheetData[0]
  const categories = sheetData.slice(1).map((r) => String(r[0]))
  const series = header.slice(1).map((name, si) => ({
    name: String(name),
    type: 'bar' as const,
    data: sheetData.slice(1).map((r) => Number(r[si + 1]) || 0),
  }))
  return {
    color: palette,
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 14 } } : undefined,
    tooltip: { trigger: 'axis' },
    legend: { top: 24 },
    grid: { left: 40, right: 20, top: 56, bottom: 28 },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
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
    color: palette,
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 14 } } : undefined,
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
