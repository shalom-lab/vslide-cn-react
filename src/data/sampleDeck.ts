import { nanoid } from 'nanoid'
import {
  defaultAnimation,
  defaultBackground,
  defaultBorder,
  defaultEchartTitle,
  defaultSlideAnimation,
  sheetNrNc,
  type Atom,
  type DeckFile,
  type Slide,
} from '../types/deck'
import { cssBackground } from '../utils/background'

const salesSheet: (string | number)[][] = [
  ['', '华东', '华北', '华南'],
  ['Q1', 120, 90, 80],
  ['Q2', 150, 110, 95],
  ['Q3', 170, 130, 120],
  ['Q4', 200, 160, 140],
]

const pieSheet: (string | number)[][] = [
  ['品类', '份额'],
  ['手机', 38],
  ['电脑', 22],
  ['平板', 15],
  ['配件', 25],
]

const tableSheet: (string | number)[][] = [
  ['季度', '华东', '华北', '华南', '合计'],
  ['Q1', 120, 90, 80, 290],
  ['Q2', 150, 110, 95, 355],
  ['Q3', 170, 130, 120, 420],
  ['Q4', 200, 160, 140, 500],
]

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

function echartDetail(
  sheetData: (string | number)[][],
  titleText: string,
  extra: Record<string, unknown> = {},
) {
  const { nr, nc } = sheetNrNc(sheetData)
  return {
    sheetData,
    nr,
    nc,
    animation: true,
    title: defaultEchartTitle(titleText),
    ...extra,
  }
}

function slide(i: string, y: number, content: Atom[]): Slide {
  return {
    i,
    x: 0,
    y,
    w: 1,
    h: 1,
    slideAnimation: defaultSlideAnimation(),
    slideContent: content,
  }
}

/** Sample deck using Vue field names (text-shadow, nr/nc, title object, …) */
export function createSampleDeck(): DeckFile {
  const background = defaultBackground()
  const slides: Slide[] = [
    slide('0', 0, [
      atom({
        i: '0',
        x: 0,
        y: 5,
        w: 18,
        h: 2,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '基于网页的数据可视化演示文稿',
            color: 'rgb(114, 138, 154)',
            fontFamily: 'Arial',
            fontSize: 36,
            fontWeight: 900,
            shadow: { h: 2, v: 2, blur: 4, color: 'rgba(48, 34, 34, 1)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 8,
        w: 18,
        h: 2,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '微思文稿 · VSlide',
            color: 'rgba(251, 152, 99, 1)',
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 900,
            shadow: { h: 2, v: 2, blur: 4, color: 'rgba(48, 34, 34, 1)' },
          },
        },
      }),
      // Intentionally overlaps the brand title so layer stacking is tryable
      atom({
        i: '2',
        x: 3,
        y: 9,
        w: 12,
        h: 3,
        atomType: 'text',
        atomContent: {
          atomName: 'text-md',
          detail: {
            editorId: nanoid(10),
            markdown:
              '右键 → **置顶 / 上移 / 下移 / 置底** 试图层叠加 · ← → 放映 · Esc 编辑',
          },
        },
      }),
    ]),
    slide('1', 1, [
      atom({
        i: '0',
        x: 0,
        y: 0,
        w: 18,
        h: 2,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '季度销售趋势',
            color: '#2c3e50',
            fontFamily: 'Arial',
            fontSize: 28,
            fontWeight: 600,
            shadow: { h: 1, v: 1, blur: 2, color: 'rgba(0,0,0,0.15)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 2,
        w: 18,
        h: 15,
        atomType: 'echart',
        atomContent: {
          atomName: 'simple-line',
          detail: echartDetail(salesSheet, '区域销售（万元）', {
            simpleLine: {
              lineStyle: { width: 2, type: 'solid' },
              smooth: false,
              areaStyle: { opacity: 0.2 },
            },
          }),
        },
      }),
    ]),
    slide('2', 2, [
      atom({
        i: '0',
        x: 0,
        y: 0,
        w: 18,
        h: 2,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '品类占比与区域对比',
            color: '#2c3e50',
            fontFamily: 'Arial',
            fontSize: 28,
            fontWeight: 600,
            shadow: { h: 1, v: 1, blur: 2, color: 'rgba(0,0,0,0.15)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 2,
        w: 9,
        h: 15,
        atomType: 'echart',
        atomContent: {
          atomName: 'simple-pie',
          detail: echartDetail(pieSheet, '品类份额', {
            simplePie: {
              clockwise: true,
              startAngle: 90,
              center: ['50%', '55%'],
              radius: ['30%', '65%'],
            },
          }),
        },
      }),
      atom({
        i: '2',
        x: 9,
        y: 2,
        w: 9,
        h: 15,
        atomType: 'echart',
        atomContent: {
          // React subset name; Vue would use multi-bar / stack-bar
          atomName: 'simple-bar',
          detail: echartDetail(salesSheet, '区域柱状对比', {
            simpleBar: {
              barMaxWidth: 40,
              barGap: '30%',
              barCategoryGap: '20%',
              borderRadius: 0,
              showBackground: false,
            },
          }),
        },
      }),
    ]),
    slide('3', 3, [
      atom({
        i: '0',
        x: 0,
        y: 0,
        w: 18,
        h: 2,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '数据一览',
            color: '#2c3e50',
            fontFamily: 'Arial',
            fontSize: 28,
            fontWeight: 600,
            shadow: { h: 1, v: 1, blur: 2, color: 'rgba(0,0,0,0.15)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 1,
        y: 3,
        w: 16,
        h: 12,
        atomType: 'tables',
        atomContent: {
          atomName: 'simple-table',
          detail: {
            sheetData: tableSheet,
            ...sheetNrNc(tableSheet),
            pagination: { pageSize: 5, show: false },
          },
        },
      }),
    ]),
    slide('4', 4, [
      atom({
        i: '0',
        x: 1,
        y: 2,
        w: 10,
        h: 12,
        atomType: 'text',
        atomContent: {
          atomName: 'text-md',
          detail: {
            editorId: nanoid(10),
            markdown: `## 设计思路

1. **数据为中心** — JSON 存储幻灯片，网页渲染
2. **组件化** — 文本 / 图表 / 表格 / 图片
3. **拖拽排版** — 18×18 网格（react-grid-layout）

### 下一步
- 云端登录与分享
- 完整图表库与动画时间轴
- Handsontable 数据编辑`,
          },
        },
      }),
      atom({
        i: '1',
        x: 11,
        y: 2,
        w: 6,
        h: 12,
        atomType: 'images',
        atomContent: {
          atomName: 'single-image',
          detail: {
            src:
              'data:image/svg+xml,' +
              encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4bc0c8"/>
      <stop offset="50%" stop-color="#c779d0"/>
      <stop offset="100%" stop-color="#feac5e"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="24" fill="url(#g)"/>
  <text x="160" y="150" text-anchor="middle" fill="white" font-size="28" font-family="sans-serif" font-weight="700">VSlide</text>
  <text x="160" y="190" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" opacity="0.9">微思文稿</text>
</svg>`),
          },
        },
      }),
    ]),
  ]

  return {
    fileType: 'vslideFile',
    fileName: 'VSlide示例-React',
    id: nanoid(),
    date: Date.now(),
    author: 'nobody',
    shared: false,
    tags: ['交互式图表', 'VSlide文稿'],
    background,
    getBackground: cssBackground(background),
    slides,
  }
}
