# Blueprint notes — vslide-vue（微思文稿）

Read-only study of `/workspace/vslide-vue` (GitHub `shalom-lab/vslide-vue`) for the React rewrite in this repo.

## Product chrome

- Brand: **微思文稿** / VSlide — web-based interactive chart presentation editor.
- Home (`/dataviz/` → `Chart.vue`): sidebar **模板图表 / 我的图表 / 演示文稿**; Naive UI shell; CloudBase login deferred in React v1.
- Edit (`/edit`): compact 4-row grid — toolbar (20px) · top icon bar (80px) · main · footer.
- Main columns: **left ~250px** slide thumbnails · **center** 16:9 working canvas · (property edits were mostly modal/drawer in Vue; React v1 uses a compact right panel).
- Modes: 编辑 `/edit` · 放映 `/play` · 浏览 `/view` · 文稿 `/doc`.

## Layout model

- **vue-grid-layout** everywhere.
  - Slide list: `col-num=1`, vertical compact, non-resizable thumbs.
  - Canvas / play: **`col-num=18`**, `row-height ≈ height/18`, `margin=[5,5]`, `vertical-compact=false`, drag via thin handle (`.dragable`).
- Canvas size: `height = min(innerH-150, (innerW-280)*9/16)`, `width = height*16/9`.

## JSON / atom model

Deck file (`fileType: vslideFile`):

```
{ fileName, id, background, getBackground, slides[] }
```

Slide: `{ i, x, y, w, h, slideAnimation: {steps,enter,leave}, slideContent[] }`

Atom: `{ i, x, y, w, h, static, atomType, atomBorder, atomAnimation, atomContent: { atomName, detail } }`

`atomType`: `text` | `echart` | `tables` | `images`  
Common `atomName`s: `text-md`, `text-shadow`, `simple-line/bar/pie`, many more echarts, `simple-table`, `single-image`.

Charts carry `detail.sheetData` (2D array) + style knobs; Vue builds ECharts options in per-chart modules.

## Editor behavior

- Top bar: 新建幻灯片 · 放映/浏览/文稿 · 图表/文本/表格/图片/背景 selectors.
- Toolbar: 返回 / 打开 JSON / 保存 (IndexedDB) / 下载.
- Working slide: click select atom, context menu for 数据/样式/边框/动画/固定/复制/删除/保存到「我的图表」.
- Left list: ↑↓ navigate slides; context 新建/复制/删除 (keep first).

## Play mode

- Full-viewport grid, non-interactive.
- Keys: **→ ↓ Space Enter** next (step then slide); **← ↑** prev; **Esc / E** → edit.
- Page indicator `n/N`; optional atom animation order (deferred in React v1).

## Stack (Vue)

Vue 3 · Vuex · vue-router · vue-grid-layout · ECharts · Naive UI · md-editor-v3 · Handsontable · animate.css · CloudBase · Electron optional.

## React v1 mapping

| Vue | React |
|-----|--------|
| vue-grid-layout | react-grid-layout |
| Vuex | zustand |
| vue-router | react-router-dom |
| vue-echarts | echarts-for-react |
| md-editor-v3 | markdown-it (render) + textarea edit |
| Naive modals | compact right property panel |

**Deferred:** CloudBase, Handsontable, full animation timeline, chart zoo, Electron, template/local galleries.

## Fidelity priorities

1. Compact grey chrome + 250px left thumbs + centered 16:9 stage.
2. 18-col grid drag/resize.
3. Chinese labels; edit ↔ play keyboard parity.
4. JSON-shaped deck compatible in spirit with vslide-vue (subset of atom names).
