import { nanoid } from 'nanoid'
import {
  defaultAnimation,
  defaultBorder,
  defaultEchartTitle,
  defaultSlideAnimation,
  defaultTableFormat,
  sheetNrNc,
  type Atom,
  type DeckFile,
  type Slide,
} from '../types/deck'
import { preferredDefaultBackground } from '../background/presets'
import { cssBackground } from '../utils/background'
import { GRID_COLS } from '../utils/grid'

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

const scatterSheet: (string | number)[][] = [
  ['组别', 'x', 'y'],
  ['A', 10.0, 8.04],
  ['A', 8.0, 6.95],
  ['A', 13.0, 7.58],
  ['B', 9.0, 8.81],
  ['B', 11.0, 8.33],
  ['B', 14.0, 9.96],
  ['C', 4.0, 4.26],
  ['C', 12.0, 10.84],
  ['C', 7.0, 4.82],
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
  const background = preferredDefaultBackground()
  const slides: Slide[] = [
    slide('0', 0, [
      // Top accent bar — gives the cover a clear header frame in thumbs + canvas
      atom({
        i: 'accent',
        x: 0,
        y: 0,
        w: 48,
        h: 3,
        atomType: 'html',
        atomContent: {
          atomName: 'custom-html',
          detail: {
            editorId: nanoid(10),
            html: `<div style="height:100%;width:100%;box-sizing:border-box;background:linear-gradient(90deg,#4bc0c8 0%,#c779d0 50%,#feac5e 100%);border-radius:0 0 4px 4px;"></div>`,
          },
        },
      }),
      atom({
        i: '0',
        x: 2,
        y: 12,
        w: 44,
        h: 6,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '基于网页的数据可视化演示文稿',
            color: 'rgb(60, 80, 100)',
            fontFamily: 'Arial',
            fontSize: 34,
            fontWeight: 800,
            shadow: { h: 1, v: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 2,
        y: 19,
        w: 44,
        h: 5,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '微思文稿 · VSlide',
            color: 'rgba(251, 140, 80, 1)',
            fontFamily: 'Arial',
            fontSize: 44,
            fontWeight: 900,
            shadow: { h: 2, v: 2, blur: 4, color: 'rgba(48, 34, 34, 0.25)' },
          },
        },
      }),
      atom({
        i: '2',
        x: 6,
        y: 27,
        w: 36,
        h: 8,
        atomType: 'text',
        atomContent: {
          atomName: 'text-md',
          detail: {
            editorId: nanoid(10),
            markdown:
              '拖框插入图表 / 表格 / 图片 · 右键 **置顶 / 上移 / 下移 / 置底** · ← → 放映 · Esc 编辑',
          },
        },
      }),
      atom({
        i: '3',
        x: 14,
        y: 40,
        w: 20,
        h: 4,
        atomType: 'html',
        atomContent: {
          atomName: 'custom-html',
          detail: {
            editorId: nanoid(10),
            html: `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;font-size:12px;color:#6b7280;letter-spacing:0.04em;">React · TypeScript · ECharts</div>`,
          },
        },
      }),
    ]),
    slide('1', 1, [
      atom({
        i: '0',
        x: 0,
        y: 0,
        w: 48,
        h: 5,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '季度销售趋势',
            color: '#1e293b',
            fontFamily: 'Arial',
            fontSize: 26,
            fontWeight: 700,
            shadow: { h: 0, v: 1, blur: 2, color: 'rgba(0,0,0,0.08)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 5,
        w: 48,
        h: 40,
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
        w: 48,
        h: 5,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '品类占比与区域对比',
            color: '#1e293b',
            fontFamily: 'Arial',
            fontSize: 26,
            fontWeight: 700,
            shadow: { h: 0, v: 1, blur: 2, color: 'rgba(0,0,0,0.08)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 5,
        w: 24,
        h: 40,
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
        x: 24,
        y: 5,
        w: 24,
        h: 40,
        atomType: 'echart',
        atomContent: {
          atomName: 'stack-bar',
          detail: echartDetail(salesSheet, '区域堆叠对比', {
            simpleBar: {
              barMaxWidth: 28,
              barGap: '5%',
              barCategoryGap: '15%',
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
        w: 48,
        h: 5,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '数据一览',
            color: '#1e293b',
            fontFamily: 'Arial',
            fontSize: 26,
            fontWeight: 700,
            shadow: { h: 0, v: 1, blur: 2, color: 'rgba(0,0,0,0.08)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 3,
        y: 8,
        w: 43,
        h: 32,
        atomType: 'tables',
        atomContent: {
          atomName: 'simple-table',
          detail: {
            sheetData: tableSheet,
            ...sheetNrNc(tableSheet),
            pagination: { pageSize: 5, show: false },
            ...defaultTableFormat(),
          },
        },
      }),
    ]),
    slide('5', 4, [
      atom({
        i: '0',
        x: 0,
        y: 0,
        w: 48,
        h: 5,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: '条形图 · 散点图',
            color: '#1e293b',
            fontFamily: 'Arial',
            fontSize: 26,
            fontWeight: 700,
            shadow: { h: 0, v: 1, blur: 2, color: 'rgba(0,0,0,0.08)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 5,
        w: 24,
        h: 40,
        atomType: 'echart',
        atomContent: {
          atomName: 'hor-bar',
          detail: echartDetail(salesSheet, '横向条形', {
            simpleBar: {
              barMaxWidth: 18,
              barGap: '8%',
              barCategoryGap: '12%',
              borderRadius: 0,
              showBackground: false,
            },
          }),
        },
      }),
      atom({
        i: '2',
        x: 24,
        y: 5,
        w: 24,
        h: 40,
        atomType: 'echart',
        atomContent: {
          atomName: 'simple-scatter',
          detail: echartDetail(scatterSheet, '分组散点', {
            simpleScatter: { symbol: 'circle', symbolSize: 14 },
          }),
        },
      }),
    ]),
    slide('4', 5, [
      atom({
        i: '0',
        x: 3,
        y: 5,
        w: 27,
        h: 32,
        atomType: 'text',
        atomContent: {
          atomName: 'text-md',
          detail: {
            editorId: nanoid(10),
            markdown: `## 设计思路

1. **数据为中心** — JSON 存储幻灯片，网页渲染
2. **组件化** — 文本 / 图表 / 表格 / 图片 / HTML
3. **拖拽排版** — 48×48 网格（react-grid-layout）

### 本版亮点
- 图表插入抽屉 · 堆叠/条形/散点
- Markdown + KaTeX：$E = mc^2$
- 共享 AtomRenderer · 撤销/重做

块级公式：

$$
\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i
$$

### 下一步
- 云端登录与分享
- 完整图表库与动画时间轴
- Handsontable 数据编辑`,
          },
        },
      }),
      atom({
        i: '1',
        x: 29,
        y: 5,
        w: 16,
        h: 32,
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
    slide('6', 6, [
      atom({
        i: '0',
        x: 0,
        y: 0,
        w: 48,
        h: 5,
        atomType: 'text',
        atomContent: {
          atomName: 'text-shadow',
          detail: {
            text: 'Markdown · 公式 · 安全 HTML',
            color: '#1e293b',
            fontFamily: 'Arial',
            fontSize: 26,
            fontWeight: 700,
            shadow: { h: 0, v: 1, blur: 2, color: 'rgba(0,0,0,0.08)' },
          },
        },
      }),
      atom({
        i: '1',
        x: 0,
        y: 5,
        w: 24,
        h: 40,
        atomType: 'text',
        atomContent: {
          atomName: 'text-md',
          detail: {
            editorId: nanoid(10),
            markdown: `## Markdown + KaTeX

支持标题、**强调**、列表与代码：

\`\`\`
npm run build
\`\`\`

| 语法 | 效果 |
|------|------|
| \`$a$\` | $a$ |
| \`$$...$$\` | 块公式 |

行内：$e^{i\\pi} + 1 = 0$

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}
$$

> HTML 嵌入也会先经 DOMPurify 消毒。`,
          },
        },
      }),
      atom({
        i: '2',
        x: 24,
        y: 5,
        w: 24,
        h: 40,
        atomType: 'html',
        atomContent: {
          atomName: 'custom-html',
          detail: {
            editorId: nanoid(10),
            html: `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#eef2ff,#fce7f3);border:1px solid #c7d2fe;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;height:100%;">
  <h3 style="margin:0 0 8px;color:#3730a3;font-size:18px;">安全 HTML 卡片</h3>
  <p style="margin:0 0 12px;color:#4c1d95;font-size:13px;line-height:1.5;">自定义 HTML 组件演示。脚本与事件处理器会被剥离。</p>
  <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:#e0e7ff;">
        <th style="padding:8px 10px;border:1px solid #c7d2fe;text-align:left;">能力</th>
        <th style="padding:8px 10px;border:1px solid #c7d2fe;text-align:left;">状态</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">静态标记 / 表格 / 样式</td>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">允许</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">&lt;script&gt; / on* / javascript:</td>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">剥离</td>
      </tr>
      <tr>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">iframe / embed</td>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">禁止</td>
      </tr>
    </tbody>
  </table>
</div>`,
          },
        },
      }),
    ]),
  ]

  return {
    fileType: 'vslideFile',
    fileName: 'VSlide产品演示',
    id: nanoid(),
    date: Date.now(),
    author: 'nobody',
    shared: false,
    tags: ['数据可视化', '产品演示', 'VSlide'],
    background,
    getBackground: cssBackground(background),
    slides,
    gridCols: GRID_COLS,
  }
}
