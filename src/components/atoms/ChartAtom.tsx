import ReactECharts from 'echarts-for-react'
import type { AtomContent, EchartTitle } from '../../types/deck'
import {
  sheetToBarOption,
  sheetToLineOption,
  sheetToPieOption,
} from '../../utils/charts'

function titleText(title: unknown): string | undefined {
  if (!title) return undefined
  if (typeof title === 'string') return title
  if (typeof title === 'object' && title !== null) {
    const t = title as EchartTitle
    return t.text ? String(t.text) : undefined
  }
  return undefined
}

export function ChartAtom({ atomContent }: { atomContent: AtomContent }) {
  const sheet = (atomContent.detail.sheetData as (string | number)[][]) || []
  const title = titleText(atomContent.detail.title)
  let option
  switch (atomContent.atomName) {
    case 'simple-bar':
    case 'multi-bar':
    case 'stack-bar':
    case 'hor-bar':
      option = sheetToBarOption(sheet, title)
      break
    case 'simple-pie':
      option = sheetToPieOption(sheet, title)
      break
    case 'simple-line':
    case 'line-zoom':
    default:
      option = sheetToLineOption(sheet, title)
      break
  }
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
