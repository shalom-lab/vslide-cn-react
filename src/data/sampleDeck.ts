import { nanoid } from 'nanoid'
import {
  defaultAnimation,
  defaultBackground,
  defaultBorder,
  type Atom,
  type DeckFile,
  type Slide,
} from '../types/deck'

const salesSheet = [
  ['', '华东', '华北', '华南'],
  ['Q1', 120, 90, 80],
  ['Q2', 150, 110, 95],
  ['Q3', 170, 130, 120],
  ['Q4', 200, 160, 140],
]

const pieSheet = [
  ['品类', '份额'],
  ['手机', 38],
  ['电脑', 22],
  ['平板', 15],
  ['配件', 25],
]

const tableSheet = [
  ['季度', '华东', '华北', '华南', '合计'],
  ['Q1', 120, 90, 80, 290],
  ['Q2', 150, 110, 95, 355],
  ['Q3', 170, 130, 120, 420],
  ['Q4', 200, 160, 140, 500],
]

function atom(
  partial: Omit<Atom, 'static' | 'atomBorder' | 'atomAnimation'> &
    Partial<Pick<Atom, 'static' | 'atomBorder' | 'atomAnimation'>>,
): Atom {
  return {
    static: false,
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    ...partial,
  }
}

function slide(i: string, y: number, content: Atom[]): Slide {
  return {
    i,
    x: 0,
    y,
    w: 1,
    h: 1,
    slideAnimation: { steps: 1, enter: 'fadeIn', leave: 'fadeOut' },
    slideContent: content,
  }
}

/** ~5-slide sample inspired by classic vslide-vue shapes */
export function createSampleDeck(): DeckFile {
  const slides: Slide[] = [
    slide('0', 0, [
      atom({
        i: '0',
        x: 1,
        y: 4,
        w: 16,
        h: 3,
        atomType: 'text',
        atomContent: {
          atomName: 'text-title',
          detail: {
            text: '微思文稿',
            fontSize: 48,
            fontWeight: 700,
            color: '#1a365d',
            align: 'center',
          },
        },
      }),
      atom({
        i: '1',
        x: 2,
        y: 8,
        w: 14,
        h: 2,
        atomType: 'text',
        atomContent: {
          atomName: 'text-md',
          detail: {
            markdown:
              '基于网页的交互式图表演示文稿 · React + TypeScript 重写\n\n← → / Space 放映 · Esc 返回编辑',
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
          atomName: 'text-title',
          detail: {
            text: '季度销售趋势',
            fontSize: 28,
            fontWeight: 600,
            color: '#2c3e50',
            align: 'left',
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
          detail: { sheetData: salesSheet, title: '区域销售（万元）' },
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
          atomName: 'text-title',
          detail: {
            text: '品类占比与区域对比',
            fontSize: 28,
            fontWeight: 600,
            color: '#2c3e50',
            align: 'left',
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
          detail: { sheetData: pieSheet, title: '品类份额' },
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
          atomName: 'simple-bar',
          detail: { sheetData: salesSheet, title: '区域柱状对比' },
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
          atomName: 'text-title',
          detail: {
            text: '数据一览',
            fontSize: 28,
            fontWeight: 600,
            color: '#2c3e50',
            align: 'left',
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
          detail: { sheetData: tableSheet },
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
            fit: 'contain',
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
    author: 'vslide-cn-react',
    tags: ['demo', 'react'],
    background: defaultBackground(),
    slides,
  }
}
