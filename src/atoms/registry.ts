/**
 * Atom registry — single source for create + render dispatch.
 * Shared by editor canvas, play stage, thumbs, and insert drawer.
 * Keep atomName / detail shapes stable for Agent skills + Vue JSON.
 */
import { nanoid } from 'nanoid'
import type { Atom, AtomType } from '../types/deck'
import {
  defaultAnimation,
  defaultBorder,
  defaultEchartTitle,
  sheetNrNc,
  defaultTableFormat,
} from '../types/deck'
import type { ChartOptionBuilder } from '../utils/charts'
import {
  sheetToBarOption,
  sheetToFunnelOption,
  sheetToHorBarOption,
  sheetToLineOption,
  sheetToPieOption,
  sheetToRadarOption,
  sheetToScatterOption,
  sheetToStackBarOption,
} from '../utils/charts'

export type ChartKind =
  | 'simple-line'
  | 'simple-bar'
  | 'multi-bar'
  | 'stack-bar'
  | 'hor-bar'
  | 'simple-pie'
  | 'simple-scatter'
  | 'simple-radar'
  | 'simple-funnel'

export type AtomCategory = 'chart' | 'text' | 'table' | 'image' | 'html'

/** Optional grid layout override when inserting (place-first). */
export type AtomLayoutOverride = Partial<Pick<Atom, 'x' | 'y' | 'w' | 'h'>>

export interface AtomRegistryEntry {
  atomName: string
  atomType: AtomType
  category: AtomCategory
  /** Chinese label for insert UI */
  label: string
  /** Short description */
  hint?: string
  /** Group tab in chart drawer */
  chartGroup?: 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'funnel' | 'other'
  /** Factory used by insert drawer / TopBar; layout overrides default position/size */
  create: (layout?: AtomLayoutOverride) => Atom
  /** ECharts option builder (echart only) */
  buildOption?: ChartOptionBuilder
}

const defaultBarSheet: (string | number)[][] = [
  ['', '系列1', '系列2'],
  ['1月', 10, 20],
  ['2月', 15, 18],
  ['3月', 22, 25],
]

const defaultPieSheet: (string | number)[][] = [
  ['项', '值'],
  ['A', 40],
  ['B', 30],
  ['C', 30],
]

const defaultScatterSheet: (string | number)[][] = [
  ['组别', 'x', 'y'],
  ['A', 10.0, 8.04],
  ['A', 8.0, 6.95],
  ['A', 13.0, 7.58],
  ['B', 9.0, 8.81],
  ['B', 11.0, 8.33],
  ['B', 14.0, 9.96],
  ['B', 6.0, 7.24],
  ['C', 4.0, 4.26],
  ['C', 12.0, 10.84],
  ['C', 7.0, 4.82],
  ['C', 5.0, 5.68],
]

function baseAtom(
  partial: Omit<Atom, 'static' | 'super' | 'atomBorder' | 'atomAnimation'> &
    Partial<Pick<Atom, 'static' | 'super' | 'atomBorder' | 'atomAnimation'>>,
): Atom {
  return {
    static: false,
    super: false,
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    ...partial,
  }
}

function applyLayout(atom: Atom, layout?: AtomLayoutOverride): Atom {
  if (!layout) return atom
  return {
    ...atom,
    ...(layout.x !== undefined ? { x: layout.x } : {}),
    ...(layout.y !== undefined ? { y: layout.y } : {}),
    ...(layout.w !== undefined ? { w: layout.w } : {}),
    ...(layout.h !== undefined ? { h: layout.h } : {}),
  }
}

function echartAtom(
  atomName: string,
  sheetData: (string | number)[][],
  extra: Record<string, unknown> = {},
  layout?: AtomLayoutOverride,
): Atom {
  const { nr, nc } = sheetNrNc(sheetData)
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 27,
      h: 21,
      atomType: 'echart',
      atomContent: {
        atomName,
        detail: {
          sheetData,
          nr,
          nc,
          animation: true,
          title: defaultEchartTitle(atomName),
          ...extra,
        },
      },
    }),
    layout,
  )
}

const DEFAULT_TEXT_MD = `## Markdown 示例

支持 **粗体**、*斜体*、\`代码\`、列表与公式。

- 行内公式：$E = mc^2$
- 块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

> 渲染经 DOMPurify 消毒，不执行 JavaScript。
`

export function createTextAtom(
  markdown = DEFAULT_TEXT_MD,
  layout?: AtomLayoutOverride,
): Atom {
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 21,
      h: 21,
      atomType: 'text',
      atomContent: {
        atomName: 'text-md',
        detail: { editorId: nanoid(10), markdown },
      },
    }),
    layout,
  )
}

export function createTextShadowAtom(
  text = '标题',
  layout?: AtomLayoutOverride,
): Atom {
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 43,
      h: 8,
      atomType: 'text',
      atomContent: {
        atomName: 'text-shadow',
        detail: {
          text,
          color: 'rgb(114, 138, 154)',
          fontFamily: 'Arial',
          fontSize: 40,
          fontWeight: 900,
          shadow: { h: 2, v: 2, blur: 4, color: 'rgba(48, 34, 34, 1)' },
        },
      },
    }),
    layout,
  )
}

export function createTableAtom(layout?: AtomLayoutOverride): Atom {
  const sheetData: (string | number)[][] = [
    ['列A', '列B', '列C'],
    ['1', '2', '3'],
    ['4', '5', '6'],
  ]
  const { nr, nc } = sheetNrNc(sheetData)
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 32,
      h: 21,
      atomType: 'tables',
      atomContent: {
        atomName: 'simple-table',
        detail: {
          sheetData,
          nr,
          nc,
          pagination: { pageSize: 5, show: false },
          ...defaultTableFormat(),
        },
      },
    }),
    layout,
  )
}

export function createImageAtom(
  src: string,
  layout?: AtomLayoutOverride,
): Atom {
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 21,
      h: 21,
      atomType: 'images',
      atomContent: {
        atomName: 'single-image',
        detail: { src },
      },
    }),
    layout,
  )
}

/** Vue image-group — gallery of images in one atom (src: string[]). */
export function createImageGroupAtom(
  srcs: string[],
  layout?: AtomLayoutOverride,
): Atom {
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 27,
      h: 21,
      atomType: 'images',
      atomContent: {
        atomName: 'image-group',
        detail: {
          src: srcs.filter(Boolean),
          height: 100,
          gap: 5,
        },
      },
    }),
    layout,
  )
}

/**
 * Split a place-first rect into a grid of cell layouts for N images.
 * Used when multi-file pick inserts multiple single-image atoms.
 */
export function tileLayoutsInRect(
  layout: AtomLayoutOverride & { x: number; y: number; w: number; h: number },
  count: number,
): Array<{ x: number; y: number; w: number; h: number }> {
  const n = Math.max(1, count)
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
  const rows = Math.max(1, Math.ceil(n / cols))
  const cellW = Math.max(1, Math.floor(layout.w / cols))
  const cellH = Math.max(1, Math.floor(layout.h / rows))
  const out: Array<{ x: number; y: number; w: number; h: number }> = []
  for (let i = 0; i < n; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Last column / row absorbs remainder so we fill the dragged rect
    const w =
      col === cols - 1
        ? Math.max(1, layout.w - cellW * (cols - 1))
        : cellW
    const h =
      row === rows - 1
        ? Math.max(1, layout.h - cellH * (rows - 1))
        : cellH
    out.push({
      x: layout.x + col * cellW,
      y: layout.y + row * cellH,
      w,
      h,
    })
  }
  return out
}


export function createCustomHtmlAtom(
  html?: string,
  layout?: AtomLayoutOverride,
): Atom {
  const sample =
    html ??
    `<div style="padding:1rem;border-radius:0.75rem;background:linear-gradient(135deg,#eef2ff,#fce7f3);border:1px solid #c7d2fe;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;height:100%;font-size:1rem;">
  <h3 style="margin:0 0 0.5em;color:#3730a3;font-size:1.25em;">安全 HTML 卡片</h3>
  <p style="margin:0 0 0.75em;color:#4c1d95;font-size:0.92em;line-height:1.5;">静态展示用。脚本、事件与 javascript: 链接会被 DOMPurify 剥离。</p>
  <table style="width:100%;border-collapse:collapse;font-size:0.92em;background:#fff;border-radius:0.5em;overflow:hidden;">
    <thead>
      <tr style="background:#e0e7ff;">
        <th style="padding:0.5em 0.65em;border:1px solid #c7d2fe;text-align:left;">项</th>
        <th style="padding:0.5em 0.65em;border:1px solid #c7d2fe;text-align:left;">说明</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:0.5em 0.65em;border:1px solid #c7d2fe;">渲染</td>
        <td style="padding:0.5em 0.65em;border:1px solid #c7d2fe;">消毒后的静态 HTML</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:0.5em 0.65em;border:1px solid #c7d2fe;">脚本</td>
        <td style="padding:0.5em 0.65em;border:1px solid #c7d2fe;">禁止执行</td>
      </tr>
    </tbody>
  </table>
</div>`
  return applyLayout(
    baseAtom({
      i: nanoid(8),
      x: 3,
      y: 3,
      w: 27,
      h: 21,
      atomType: 'html',
      atomContent: {
        atomName: 'custom-html',
        detail: { editorId: nanoid(10), html: sample },
      },
    }),
    layout,
  )
}

export function createChartAtom(
  kind: ChartKind,
  layout?: AtomLayoutOverride,
): Atom {
  const entry = ATOM_REGISTRY[kind]
  if (entry?.atomType === 'echart') return entry.create(layout)
  // fallback
  return echartAtom(
    kind,
    defaultBarSheet,
    {
      simpleBar: {
        barMaxWidth: 40,
        barGap: '30%',
        barCategoryGap: '20%',
        borderRadius: 0,
        showBackground: false,
      },
    },
    layout,
  )
}

/** Canonical registry keyed by atomName (Vue names preferred). */
export const ATOM_REGISTRY: Record<string, AtomRegistryEntry> = {
  'text-md': {
    atomName: 'text-md',
    atomType: 'text',
    category: 'text',
    label: 'Markdown',
    hint: 'Markdown + KaTeX 公式（安全渲染）',
    create: (layout) => createTextAtom(undefined, layout),
  },
  'text-shadow': {
    atomName: 'text-shadow',
    atomType: 'text',
    category: 'text',
    label: '阴影标题',
    hint: '大字标题 + 阴影',
    create: (layout) => createTextShadowAtom(undefined, layout),
  },
  'custom-html': {
    atomName: 'custom-html',
    atomType: 'html',
    category: 'html',
    label: 'HTML',
    hint: '安全自定义 HTML（不执行 JS）',
    create: (layout) => createCustomHtmlAtom(undefined, layout),
  },
  'simple-table': {
    atomName: 'simple-table',
    atomType: 'tables',
    category: 'table',
    label: '表格',
    create: (layout) => createTableAtom(layout),
  },
  'single-image': {
    atomName: 'single-image',
    atomType: 'images',
    category: 'image',
    label: '图片',
    create: (layout) => createImageAtom('', layout),
  },
  'image-group': {
    atomName: 'image-group',
    atomType: 'images',
    category: 'image',
    label: '图片组',
    hint: '多图画廊（Vue image-group）',
    create: (layout) => createImageGroupAtom([], layout),
  },
  'simple-line': {
    atomName: 'simple-line',
    atomType: 'echart',
    category: 'chart',
    label: '折线图',
    chartGroup: 'line',
    buildOption: sheetToLineOption,
    create: (layout) =>
      echartAtom(
        'simple-line',
        defaultBarSheet,
        {
          simpleLine: {
            lineStyle: { width: 2, type: 'solid' },
            smooth: false,
            areaStyle: { opacity: 0.2 },
          },
        },
        layout,
      ),
  },
  'simple-bar': {
    atomName: 'simple-bar',
    atomType: 'echart',
    category: 'chart',
    label: '柱状图',
    hint: 'React 子集；Vue 多用 multi-bar',
    chartGroup: 'bar',
    buildOption: sheetToBarOption,
    create: (layout) =>
      echartAtom(
        'simple-bar',
        defaultBarSheet,
        {
          simpleBar: {
            barMaxWidth: 40,
            barGap: '30%',
            barCategoryGap: '20%',
            borderRadius: 0,
            showBackground: false,
          },
        },
        layout,
      ),
  },
  'multi-bar': {
    atomName: 'multi-bar',
    atomType: 'echart',
    category: 'chart',
    label: '分组柱状',
    chartGroup: 'bar',
    buildOption: sheetToBarOption,
    create: (layout) =>
      echartAtom(
        'multi-bar',
        defaultBarSheet,
        {
          simpleBar: {
            barMaxWidth: 40,
            barGap: '30%',
            barCategoryGap: '20%',
            borderRadius: 0,
            showBackground: false,
          },
        },
        layout,
      ),
  },
  'stack-bar': {
    atomName: 'stack-bar',
    atomType: 'echart',
    category: 'chart',
    label: '堆叠柱状',
    chartGroup: 'bar',
    buildOption: sheetToStackBarOption,
    create: (layout) =>
      echartAtom(
        'stack-bar',
        [
          ['', 'Ford', 'Tesla', 'Toyota', 'Honda'],
          ['2017', 10, 11, 12, 13],
          ['2018', 20, 11, 14, 13],
          ['2019', 30, 15, 12, 13],
        ],
        {
          simpleBar: {
            barMaxWidth: 20,
            barGap: '5%',
            barCategoryGap: '5%',
            borderRadius: [0, 0, 0, 0],
            showBackground: false,
          },
        },
        layout,
      ),
  },
  'hor-bar': {
    atomName: 'hor-bar',
    atomType: 'echart',
    category: 'chart',
    label: '条形图',
    hint: '横向柱状',
    chartGroup: 'bar',
    buildOption: sheetToHorBarOption,
    create: (layout) =>
      echartAtom(
        'hor-bar',
        [
          ['', 'Ford', 'Tesla', 'Toyota', 'Honda'],
          ['2017', 10, 11, 12, 13],
          ['2018', 20, 11, 14, 13],
          ['2019', 30, 15, 12, 13],
        ],
        {
          simpleBar: {
            barMaxWidth: 20,
            barGap: '5%',
            barCategoryGap: '5%',
            borderRadius: 0,
            showBackground: false,
          },
        },
        layout,
      ),
  },
  'simple-pie': {
    atomName: 'simple-pie',
    atomType: 'echart',
    category: 'chart',
    label: '饼图',
    chartGroup: 'pie',
    buildOption: sheetToPieOption,
    create: (layout) =>
      echartAtom(
        'simple-pie',
        defaultPieSheet,
        {
          simplePie: {
            clockwise: true,
            startAngle: 90,
            center: ['50%', '55%'],
            radius: ['30%', '65%'],
          },
        },
        layout,
      ),
  },
  'simple-scatter': {
    atomName: 'simple-scatter',
    atomType: 'echart',
    category: 'chart',
    label: '散点图',
    chartGroup: 'scatter',
    buildOption: sheetToScatterOption,
    create: (layout) =>
      echartAtom(
        'simple-scatter',
        defaultScatterSheet,
        {
          simpleScatter: { symbol: 'circle', symbolSize: 14 },
        },
        layout,
      ),
  },

  'simple-radar': {
    atomName: 'simple-radar',
    atomType: 'echart',
    category: 'chart',
    label: '雷达图',
    chartGroup: 'radar',
    buildOption: sheetToRadarOption,
    create: (layout) =>
      echartAtom(
        'simple-radar',
        [
          ['', 'AQI', 'PM2.5', 'PM10', 'CO', 'NO2', 'SO2'],
          ['轴最小值', 0, 0, 0, 0, 0, 0],
          ['轴最大值', 100, 50, 150, 5, 50, 50],
          ['上海', 91, 45, 125, 0.82, 34, 23],
          ['北京', 55, 9, 56, 0.46, 18, 6],
          ['广州', 26, 37, 27, 1.16, 27, 13],
        ],
        {
          simpleRadar: {
            shape: 'polygon',
            center: ['50%', '58%'],
            radius: '62%',
          },
        },
        layout,
      ),
  },
  'simple-funnel': {
    atomName: 'simple-funnel',
    atomType: 'echart',
    category: 'chart',
    label: '漏斗图',
    chartGroup: 'funnel',
    buildOption: sheetToFunnelOption,
    create: (layout) =>
      echartAtom(
        'simple-funnel',
        [
          ['Exposure', 200],
          ['Infection', 120],
          ['Symptom', 70],
          ['Outpatient', 40],
          ['Hospitalized', 25],
          ['Death', 10],
        ],
        {
          simpleFunnel: {
            sort: 'descending',
            gap: 2,
          },
        },
        layout,
      ),
  },
}

/** Aliases that share a registry entry's builder (not insertable themselves). */
export const ATOM_ALIASES: Record<string, string> = {
  'line-zoom': 'simple-line',
  'hor-stack': 'stack-bar',
  'simple-bubble': 'simple-scatter',
  'text-title': 'text-shadow', // legacy React invent → Vue name
}

export function resolveAtomEntry(atomName: string): AtomRegistryEntry | undefined {
  const key = ATOM_ALIASES[atomName] ?? atomName
  return ATOM_REGISTRY[key]
}

/** Charts shown in the insert drawer (ordered). */
export const CHART_INSERT_LIST: AtomRegistryEntry[] = [
  ATOM_REGISTRY['simple-bar'],
  ATOM_REGISTRY['multi-bar'],
  ATOM_REGISTRY['stack-bar'],
  ATOM_REGISTRY['hor-bar'],
  ATOM_REGISTRY['simple-line'],
  ATOM_REGISTRY['simple-pie'],
  ATOM_REGISTRY['simple-scatter'],
  ATOM_REGISTRY['simple-radar'],
  ATOM_REGISTRY['simple-funnel'],
]

export const CHART_GROUPS: { id: NonNullable<AtomRegistryEntry['chartGroup']>; label: string }[] = [
  { id: 'bar', label: '柱状图' },
  { id: 'line', label: '折线图' },
  { id: 'pie', label: '饼图' },
  { id: 'scatter', label: '散点' },
  { id: 'radar', label: '雷达' },
  { id: 'funnel', label: '漏斗' },
]
