import ReactECharts from 'echarts-for-react'
import type { AtomContent } from '../../types/deck'
import {
  sheetToBarOption,
  sheetToLineOption,
  sheetToPieOption,
} from '../../utils/charts'

export function ChartAtom({ atomContent }: { atomContent: AtomContent }) {
  const sheet = (atomContent.detail.sheetData as (string | number)[][]) || []
  const title = atomContent.detail.title
    ? String(atomContent.detail.title)
    : undefined
  let option
  switch (atomContent.atomName) {
    case 'simple-bar':
      option = sheetToBarOption(sheet, title)
      break
    case 'simple-pie':
      option = sheetToPieOption(sheet, title)
      break
    case 'simple-line':
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
