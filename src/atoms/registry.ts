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
} from '../types/deck'
import type { ChartOptionBuilder } from '../utils/charts'
import {
  sheetToBarOption,
  sheetToHorBarOption,
  sheetToLineOption,
  sheetToPieOption,
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

export type AtomCategory = 'chart' | 'text' | 'table' | 'image'

export interface AtomRegistryEntry {
  atomName: string
  atomType: AtomType
  category: AtomCategory
  /** Chinese label for insert UI */
  label: string
  /** Short description */
  hint?: string
  /** Group tab in chart drawer */
  chartGroup?: 'bar' | 'line' | 'pie' | 'scatter' | 'other'
  /** Factory used by insert drawer / TopBar */
  create: () => Atom
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

function echartAtom(
  atomName: string,
  sheetData: (string | number)[][],
  extra: Record<string, unknown> = {},
): Atom {
  const { nr, nc } = sheetNrNc(sheetData)
  return baseAtom({
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 10,
    h: 8,
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
  })
}

export function createTextAtom(markdown = '## 新文本'): Atom {
  return baseAtom({
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 8,
    h: 4,
    atomType: 'text',
    atomContent: {
      atomName: 'text-md',
      detail: { editorId: nanoid(10), markdown },
    },
  })
}

export function createTextShadowAtom(text = '标题'): Atom {
  return baseAtom({
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 16,
    h: 3,
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
  })
}

export function createTableAtom(): Atom {
  const sheetData: (string | number)[][] = [
    ['列A', '列B', '列C'],
    ['1', '2', '3'],
    ['4', '5', '6'],
  ]
  const { nr, nc } = sheetNrNc(sheetData)
  return baseAtom({
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 12,
    h: 8,
    atomType: 'tables',
    atomContent: {
      atomName: 'simple-table',
      detail: {
        sheetData,
        nr,
        nc,
        pagination: { pageSize: 5, show: false },
      },
    },
  })
}

export function createImageAtom(src: string): Atom {
  return baseAtom({
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 8,
    h: 8,
    atomType: 'images',
    atomContent: {
      atomName: 'single-image',
      detail: { src },
    },
  })
}

export function createChartAtom(kind: ChartKind): Atom {
  const entry = ATOM_REGISTRY[kind]
  if (entry?.atomType === 'echart') return entry.create()
  // fallback
  return echartAtom(kind, defaultBarSheet, {
    simpleBar: {
      barMaxWidth: 40,
      barGap: '30%',
      barCategoryGap: '20%',
      borderRadius: 0,
      showBackground: false,
    },
  })
}

/** Canonical registry keyed by atomName (Vue names preferred). */
export const ATOM_REGISTRY: Record<string, AtomRegistryEntry> = {
  'text-md': {
    atomName: 'text-md',
    atomType: 'text',
    category: 'text',
    label: 'Markdown',
    hint: 'Markdown 文本',
    create: () => createTextAtom(),
  },
  'text-shadow': {
    atomName: 'text-shadow',
    atomType: 'text',
    category: 'text',
    label: '阴影标题',
    hint: '大字标题 + 阴影',
    create: () => createTextShadowAtom(),
  },
  'simple-table': {
    atomName: 'simple-table',
    atomType: 'tables',
    category: 'table',
    label: '表格',
    create: () => createTableAtom(),
  },
  'single-image': {
    atomName: 'single-image',
    atomType: 'images',
    category: 'image',
    label: '图片',
    create: () => createImageAtom(''),
  },
  'simple-line': {
    atomName: 'simple-line',
    atomType: 'echart',
    category: 'chart',
    label: '折线图',
    chartGroup: 'line',
    buildOption: sheetToLineOption,
    create: () =>
      echartAtom('simple-line', defaultBarSheet, {
        simpleLine: {
          lineStyle: { width: 2, type: 'solid' },
          smooth: false,
          areaStyle: { opacity: 0.2 },
        },
      }),
  },
  'simple-bar': {
    atomName: 'simple-bar',
    atomType: 'echart',
    category: 'chart',
    label: '柱状图',
    hint: 'React 子集；Vue 多用 multi-bar',
    chartGroup: 'bar',
    buildOption: sheetToBarOption,
    create: () =>
      echartAtom('simple-bar', defaultBarSheet, {
        simpleBar: {
          barMaxWidth: 40,
          barGap: '30%',
          barCategoryGap: '20%',
          borderRadius: 0,
          showBackground: false,
        },
      }),
  },
  'multi-bar': {
    atomName: 'multi-bar',
    atomType: 'echart',
    category: 'chart',
    label: '分组柱状',
    chartGroup: 'bar',
    buildOption: sheetToBarOption,
    create: () =>
      echartAtom('multi-bar', defaultBarSheet, {
        simpleBar: {
          barMaxWidth: 40,
          barGap: '30%',
          barCategoryGap: '20%',
          borderRadius: 0,
          showBackground: false,
        },
      }),
  },
  'stack-bar': {
    atomName: 'stack-bar',
    atomType: 'echart',
    category: 'chart',
    label: '堆叠柱状',
    chartGroup: 'bar',
    buildOption: sheetToStackBarOption,
    create: () =>
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
    create: () =>
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
      ),
  },
  'simple-pie': {
    atomName: 'simple-pie',
    atomType: 'echart',
    category: 'chart',
    label: '饼图',
    chartGroup: 'pie',
    buildOption: sheetToPieOption,
    create: () =>
      echartAtom('simple-pie', defaultPieSheet, {
        simplePie: {
          clockwise: true,
          startAngle: 90,
          center: ['50%', '55%'],
          radius: ['30%', '65%'],
        },
      }),
  },
  'simple-scatter': {
    atomName: 'simple-scatter',
    atomType: 'echart',
    category: 'chart',
    label: '散点图',
    chartGroup: 'scatter',
    buildOption: sheetToScatterOption,
    create: () =>
      echartAtom('simple-scatter', defaultScatterSheet, {
        simpleScatter: { symbol: 'circle', symbolSize: 14 },
      }),
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
]

export const CHART_GROUPS: { id: NonNullable<AtomRegistryEntry['chartGroup']>; label: string }[] = [
  { id: 'bar', label: '柱状图' },
  { id: 'line', label: '折线图' },
  { id: 'pie', label: '饼图' },
  { id: 'scatter', label: '散点' },
]
