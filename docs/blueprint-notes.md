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


## Atom stacking / z-order (图层叠加)

### What Vue does

- **vue-grid-layout** with `preventCollision={false}` + `vertical-compact={false}` → atoms **may overlap**.
- Paint order = **`slideContent` array / DOM order** (later siblings on top). No `zIndex` field on atoms.
- Context menu (**WorkingSlide.vue**): 数据 / 样式 / 边框 / 动画 / 固定 / 复制 / 删除 / 保存 — **no 置顶/置底/上移/下移**.
- Library only bumps z-index while dragging/resizing (`.vue-draggable-dragging` / `.resizing` → `z-index: 3`); placeholder `z-index: 2`. Idle overlap is pure stacking context from DOM order.
- There is **no** bring-forward / send-back mutation in Vuex.

### What React ships (this pass)

- Optional **`atom.zIndex`** (React extension; 1..n mirrors array order). Serialize round-trips it; Vue JSON without it gets index-based defaults.
- Canonical order remains **`slideContent` array** (last = top). `reorderActiveAtom` reorders the array and reassigns `zIndex`.
- UI: atom context menu **置顶 / 上移一层 / 下移一层 / 置底** + property panel **图层** buttons.
- Canvas / play / thumbs apply `style.zIndex`. Selected atom gets a temporary (+50000) boost for editing; drag/resize forced to `z-index: 100000 !important` so RGL’s default 1–3 does not lose to user layers.
- **`allowOverlap={true}`** on Canvas / Play / Thumb `GridLayout` (RGL 1.5+ defaults to false and *pushes* other items on drag even with `compactType={null}` + `preventCollision={false}`). Vue’s older grid effectively allowed overlap without this prop.
- `preventCollision={false}` + `compactType={null}` kept — no auto-compact; `onDragStop`/`onResizeStop` write back only the moved item’s x/y/w/h from RGL.
- Two atoms may share cells; right-click **置顶/上移/下移/置底** controls who paints on top.

### Known limits

- No multi-select layer ops; no keyboard shortcuts for layers yet.
- Temporary selection boost is visual-only (not persisted).
- Vue files ignore `zIndex` on import into Vue; React re-sorts by `zIndex` when present on load.
- Clicking through fully covered atoms still requires layer reorder or selecting via other UI.

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

## Vuex store contract (source of truth)

Read from `/workspace/vslide-vue/src/store/index.js` (Vuex, **not** Pinia), atom factories under `src/store/atom/*` + `src/components/Atom/{Text,Echart,Tables,Images}/**/*.js`, and persisted deck shape in `src/Template/vslides.json` / `demo-raw/*.json`.

### Root Vuex `state` keys

| Key | Shape / default | Role |
|-----|-----------------|------|
| `layout` | `Slide[]` | Working deck slides (= active file’s `slides`) |
| `iActive` | `{ slide: string, atom: string }` | Selection; `atom` is `"-1"` / unset when none |
| `iMax` | `{ slide: number, atom: number }` | Monotonic id counters (default 1000) |
| `atom` | `{ echart, text, images, tables }` | Factory catalog keyed by `atomName` |
| `editorOption` | Record | Border/animation/per-atom editor UI metadata |
| `background` | `BackgroundConfig` | Active file background |
| `innerSize` | `{ width, height }` | Viewport measure |
| `workingAreaKey` | `number` | Force remount working canvas |
| `leftAreaKey` | `number` | Force remount left slide list |
| `gallery` | `{ templateLayout, localLayout: [{ slideContent }], activeIndex }` | Template / 「我的图表」 |
| `document` | `{ fileList: DeckFile[], activeIndex, templateFile }` | Multi-file workspace |
| `template` | `{ vslides, slides }` | Boot templates |
| `store` | IndexedDB handle \| null | Persistence |
| `loginState` | object \| null | CloudBase auth |
| `account` | `{ role, date_expire, max_file, max_size, total_file, total_size }` | Quotas / `super` lock |
| `sharedFileList` | array | Shared files |
| `mapList` | `[{ mapName, mapObj }]` | Map chart GeoJSON |

### Mutations that define the write contract

- **Slides:** `addSlide(payload)`, `removeSlide(index)`, `changeLayout({ layout })`, `changeSlideAnimation({ key, value })`
- **Selection:** `updateIActive({ slide, atom })`
- **Atoms:** `addAtom(atom)`, `removeAtom()`, `fixedAtom()` (toggles `static`), `changeAtom({ menuValue, key, value })` (dot-path via eval), `changeSheetData({ sheetData, nr, nc, menuValue })`
- **Background / chrome:** `changeBackground({ background })`, `changeInnersize`, `changeWorkingAreaKey`, `changeLeftAreaKey`
- **Gallery / files:** `addLocalAtom`, `initLocalAtom`, `changeDocumentActiveIndex`, `changeDocumentFileList`, `addFile`, `removeFile`, …

Getters: `activeSlide`, `activeSlideContent`, `activeAtom`, `indexActive`, `blankArea`, `getBackground` (CSS string from `background.mode`), `sortLayout` (reindexes `i` + sets `slideAnimation.steps = max(atomAnimation.order)`).

### Persisted `DeckFile` (`fileType: "vslideFile"`)

Concrete keys from `Template/vslides.json` / demo JSON:

```
fileType, fileName, id, date, author, shared, tags,
background, getBackground, slides
```

- `shared: boolean`
- `getBackground: string` — **serialized CSS** (same string as Vuex getter `getBackground`), not only live-computed
- `background` always carries **all** mode payloads (not only the active one):

```
mode: "pure" | "linear" | "radial" | "custom" | "image" | "texture"
pure: string (rgba/css color)
linear: { angle, start, end }
radial: { shape, start, end }
custom: string (css)
image: { src, repeat, x, y, width, height }
texture: { src }
```

### `Slide`

```
i, x, y, w, h,          // slide-list grid (col-num=1); x=0,w=1,h=1 typical
slideAnimation: { steps, enter, leave },
slideContent: Atom[],
moved?: boolean         // vue-grid-layout runtime
```

### `Atom` (component instance)

Union of fields seen in factories + saved JSON:

```
i, x, y, w, h,          // canvas grid col-num=18
static: boolean,        // lock; factories often typo as "stacic" — runtime / template use "static"
super: boolean,         // template-protected; forbids edit when account.role === "user"
atomType: "text" | "echart" | "tables" | "images",
atomBorder: { width, type, color, radius },
atomAnimation: { order, enter, leave },
atomContent: { atomName, detail },
moved?: boolean
```

Defaults from factories / `atomBorder.js` / `atomAnimation.js`:

- `atomBorder`: `{ width: 0, type: "solid", color: "#808080", radius: 1 }`
- `atomAnimation`: `{ order: 1, enter: "fadeIn", leave: "fadeOut" }`
- `slideAnimation`: `{ steps: 1, enter: "fadeIn", leave: "fadeOut" }`
- `static: false`, `super: false`

### `atomName` catalog (factories)

- **text:** `text-md`, `text-shadow` (there is **no** `text-title` in Vue)
- **tables:** `simple-table`
- **images:** `single-image`, `image-group`
- **echart:** `simple-line`, `simple-pie`, `simple-radar`, `simple-funnel`, `simple-box`, `simple-bubble`, `simple-scatter`, `simple-sankey`, `multi-bar`, `stack-bar`, `hor-bar`, `hor-stack`, `bi-bar`, `bar-line`, `bar-zoom`, `line-zoom`, `heat-map`, `pop-pyramid`, `tm-multi-bar`, `racing-bar`, `word-cloud`, `map-c`, `map-p`, `echart-reg`, … (`simple-parallel` / `base-calendar` deleted from catalog)

### `detail` contracts (by atomName)

**text-md:** `{ editorId | editorid, markdown }`  
**text-shadow:** `{ text, color, fontFamily, fontSize, fontWeight, shadow: { h, v, blur, color } }`  
**simple-table:** `{ sheetData, nr, nc, pagination: { pageSize, show } }`  
**single-image:** `{ src }` only  
**image-group:** `{ src: string[], height, gap }`  
**echart (common):** `{ sheetData, nr, nc, animation, palette, backgroundPalette, title /* ECharts title object */, grid?, xAxis?, yAxis?, legend?, label?, itemStyle?, emphasis?, <chartSpecific> }`  
Chart-specific nests: `simpleLine`, `simpleBar`, `simplePie`, `simpleRadar`, `simpleFunnel`, `simpleScatter`, `simpleSankey`, `simpleMap`, `dataZoom`, `visualMapC`, `popPyramid`, `racingBar`, `wordCloud`, `reg`, …

`changeSheetData` always writes **`sheetData` + `nr` + `nc`** together.

### Atom context menu (WorkingSlide.vue — verified, do not invent)

1. 数据 → `edit('sheetData')` (enabled when `atomType` ∈ echart|tables)
2. 样式 → `edit('atomContent')` (disabled for `text-md` / `simple-table` style editors in Vue)
3. 边框 → `edit('atomBorder')`
4. 动画 → `edit('atomAnimation')`
5. 固定 → `fixedAtom()` toggle `static`
6. 复制 → deep-copy atom, new `i`, `y+1`, regen `editorId` for text-md
7. 删除 → `removeAtom()`
8. 保存 → clone into `gallery.localLayout`「我的图表」

**React-only layer items (not in Vue menu):** 置顶 / 上移一层 / 下移一层 / 置底

**Not present in Vue:** bring forward / send back / layer z-order UI (overlap via DOM order only — see **Atom stacking / z-order**).

### Slide list context menu (Left.vue)

新建幻灯片 · 复制幻灯片 · 删除幻灯片

### React deltas vs this contract (pre-alignment)

| Area | Vue | React (before this pass) |
|------|-----|--------------------------|
| Deck | `shared`, `getBackground` | missing |
| Background | `image`, `texture` modes | only pure/linear/radial/custom |
| Atom | `super`, optional `moved` | missing `super` |
| Title text | `text-shadow` | invented `text-title` |
| text-md | `editorId` / `editorid` | markdown only |
| Chart detail | `nr`/`nc` + ECharts `title` object + style nests | flat `title: string`, no nr/nc |
| Table detail | `nr`/`nc`/`pagination` | `sheetData` only |
| Image detail | `src` only | invented `fit` |
| Chart names | no `simple-bar` (use multi-bar etc.) | `simple-bar` React subset |
| Context menu | full atom + slide menus | absent |


### Alignment pass (2026-10-13)

Mirrored into React:

- Deck: `shared`, `getBackground`; Background: `image` / `texture`
- Atom: `super`, `static`; drop invented `text-title` → `text-shadow`
- text-md `editorId`; echart/tables `nr`/`nc`; echart `title` object; table `pagination`; image `{ src }` only
- `normalizeDeck` / `serializeDeck` adapters (tolerate `stacic`, map legacy `text-title`)
- Atom context menu (数据/样式/边框/动画/固定/复制/删除/保存) + slide list menu (新建/复制/删除)
- 「保存」→ `localStorage` gallery (`vslide-cn-react:localAtoms`)

Still missing vs Vue:

- Full echart zoo + style nests editing UI; Handsontable sheet editor; animate.css play timeline
- `gallery.templateLayout` / CloudBase / IndexedDB multi-file `document.fileList`
- ~~Layer z-order~~ → React added 置顶/置底/上移/下移 + `zIndex` (Vue still DOM-order only)
- `simple-bar` remains React subset alias (Vue: multi-bar / stack-bar / …)

## Atom registry + shared renderer (2026-10-13 wave)

- **`src/atoms/registry.ts`** — single catalog of `atomName` → `{ atomType, label, create, buildOption? }`. Insert drawer, factories, and chart option builders read from here.
- **`AtomRenderer`** — one path for Canvas / Play / thumbs. Dispatch by `atomType` (with registry alias resolve).
- **Chart insert drawer** — TopBar「图表」opens right drawer (Vue `SEchart` analogue): tabs 柱状/折线/饼图/散点; click preview to insert.
- **New chart names shipped:** `stack-bar`, `hor-bar`, `simple-scatter` (+ `multi-bar` insertable). Option builders in `utils/charts.ts`.
- **Undo/redo** — zustand `past`/`future` deck snapshots (limit 50). `Ctrl+Z` / `Ctrl+Y` / TopBar buttons. Detail typing debounced (~400ms) into history.
- JSON contract unchanged: prefer Vue `atomName`s; `simple-bar` remains React subset alias.

### Next wave ideas

- Wire「我的图表」gallery into drawer tab
- More echart zoo (radar / funnel / sankey) via registry entries only
- Keyboard layer shortcuts; multi-select
- Persist undo across reload (optional)
