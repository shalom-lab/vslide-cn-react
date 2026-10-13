/**
 * Slide layout templates — insert as a new slide (PPT-like).
 * Distinct from Vue's chart-atom gallery; complements ChartInsertDrawer.
 */
import { nanoid } from 'nanoid'
import {
  defaultAnimation,
  defaultBorder,
  defaultEchartTitle,
  defaultSlideAnimation,
  defaultTableFormat,
  sheetNrNc,
  type Atom,
  type Slide,
} from '../types/deck'
import { createChartAtom, createTextAtom, createTextShadowAtom, createTableAtom, createCustomHtmlAtom } from '../atoms/registry'

export interface SlideTemplate {
  id: string
  name: string
  hint: string
  /** Accent color for gallery card */
  swatch: string
  build: () => Slide
}

function atom(
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

function blankSlide(content: Atom[]): Slide {
  return {
    i: nanoid(8),
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    slideAnimation: defaultSlideAnimation(),
    slideContent: content,
  }
}

const demoSheet: (string | number)[][] = [
  ['', '华东', '华北', '华南'],
  ['Q1', 120, 90, 80],
  ['Q2', 150, 110, 95],
  ['Q3', 170, 130, 120],
  ['Q4', 200, 160, 140],
]

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'cover',
    name: '封面',
    hint: '渐变顶条 + 大标题',
    swatch: 'linear-gradient(90deg,#4bc0c8,#c779d0,#feac5e)',
    build: () =>
      blankSlide([
        atom({
          i: nanoid(6),
          x: 0,
          y: 0,
          w: 48,
          h: 3,
          atomType: 'html',
          atomContent: {
            atomName: 'custom-html',
            detail: {
              editorId: nanoid(10),
              html: `<div style="height:100%;background:linear-gradient(90deg,#4bc0c8,#c779d0,#feac5e);"></div>`,
            },
          },
        }),
        createTextShadowAtom('演示标题', { x: 2, y: 14, w: 44, h: 6 }),
        createTextAtom('副标题或一句话说明', { x: 6, y: 22, w: 36, h: 6 }),
      ]),
  },
  {
    id: 'title-line',
    name: '标题 + 折线',
    hint: '全宽趋势图',
    swatch: '#dbeafe',
    build: () => {
      const chart = createChartAtom('simple-line', { x: 0, y: 5, w: 48, h: 40 })
      chart.atomContent.detail = {
        ...chart.atomContent.detail,
        sheetData: demoSheet,
        ...sheetNrNc(demoSheet),
        title: defaultEchartTitle('趋势'),
      }
      return blankSlide([
        createTextShadowAtom('章节标题', { x: 0, y: 0, w: 48, h: 5 }),
        chart,
      ])
    },
  },
  {
    id: 'two-charts',
    name: '双栏对比',
    hint: '饼图 + 柱状',
    swatch: '#fce7f3',
    build: () => {
      const pie = createChartAtom('simple-pie', { x: 0, y: 5, w: 24, h: 40 })
      const bar = createChartAtom('multi-bar', { x: 24, y: 5, w: 24, h: 40 })
      return blankSlide([
        createTextShadowAtom('对比分析', { x: 0, y: 0, w: 48, h: 5 }),
        pie,
        bar,
      ])
    },
  },
  {
    id: 'table-page',
    name: '数据表',
    hint: '标题 + 表格',
    swatch: '#ecfdf5',
    build: () => {
      const table = createTableAtom({ x: 3, y: 8, w: 42, h: 32 })
      const sheet = [
        ['季度', '华东', '华北', '华南', '合计'],
        ['Q1', 120, 90, 80, 290],
        ['Q2', 150, 110, 95, 355],
        ['Q3', 170, 130, 120, 420],
        ['Q4', 200, 160, 140, 500],
      ]
      table.atomContent.detail = {
        ...table.atomContent.detail,
        sheetData: sheet,
        ...sheetNrNc(sheet),
        ...defaultTableFormat(),
      }
      return blankSlide([
        createTextShadowAtom('数据一览', { x: 0, y: 0, w: 48, h: 5 }),
        table,
      ])
    },
  },
  {
    id: 'text-image',
    name: '图文混排',
    hint: '左文右图',
    swatch: '#fef3c7',
    build: () =>
      blankSlide([
        createTextShadowAtom('图文页', { x: 0, y: 0, w: 48, h: 5 }),
        createTextAtom(
          '## 要点\n\n1. 第一条说明\n2. 第二条说明\n3. 第三条说明\n\n> 可在右侧替换图片',
          { x: 1, y: 6, w: 26, h: 36 },
        ),
        createCustomHtmlAtom(
          `<div style="height:100%;border-radius:12px;background:linear-gradient(135deg,#4bc0c8,#c779d0);display:flex;align-items:center;justify-content:center;color:#fff;font:700 22px system-ui;">图片区</div>`,
          { x: 28, y: 6, w: 18, h: 36 },
        ),
      ]),
  },
  {
    id: 'section',
    name: '章节页',
    hint: '大字居中过渡',
    swatch: '#e0e7ff',
    build: () =>
      blankSlide([
        createTextShadowAtom('01', { x: 2, y: 10, w: 44, h: 8 }),
        createTextShadowAtom('章节名称', {
          x: 2,
          y: 20,
          w: 44,
          h: 8,
        }),
        createTextAtom('简短导语', { x: 8, y: 30, w: 32, h: 6 }),
      ]),
  },
  {
    id: 'blank',
    name: '空白页',
    hint: '从零排版',
    swatch: '#f3f4f6',
    build: () => blankSlide([]),
  },
]
