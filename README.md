# vslide-cn-react · 微思文稿

React + TypeScript rewrite of the interactive slide editor, faithful to the compact UX of the Vue blueprint [`vslide-vue`](https://github.com/shalom-lab/vslide-vue).

> This repo is the React greenfield. Do **not** confuse with `vslide-cn` (abandoned Vue scaffold) or `vslide-vue` (read-only blueprint).

## Features

- **演示文稿** path: multi-slide edit ↔ play
- 48×48 **react-grid-layout** canvas (drag / resize / overlap + 置顶/置底)
- **Shared `AtomRenderer`** for edit · play · thumbs (no dual drift)
- **Atom registry** (`src/atoms/registry.ts`) for text / chart / table / image / **custom-html**
- **Markdown (`text-md`)** with KaTeX math (`$…$` / `$$…$$`) and prose styles; **DOMPurify** before render
- **Safe HTML (`custom-html`)** — static markup only; scripts / event handlers / `javascript:` stripped
- Charts: line · bar · **stack-bar** · **hor-bar** · pie · **scatter** — **place-first** (拖框再选图) via insert drawer
- **文字 / HTML** place-first：拖框后在**右侧抽屉**选 **正文** (`text-md`) / **标题** (`text-shadow`) / **HTML** (`custom-html`)，与图表一致；Esc 取消
- Undo / redo (`Ctrl+Z` / `Ctrl+Y`) for deck mutations
- Compact Chinese chrome; sample deck (~6 slides)
- **背景模板库**（顶部「背景」）：柔和图片衬底 + 干净纯色预设 / 自定义 CSS·图片 / 我的背景（localStorage）
- Play: `←` `→` / Space / Esc→edit
- **相对 rem 排版**：画布 / 播放 / 缩略图舞台根字号 = 高度÷36，Markdown·标题·HTML·表格用 rem/em 随舞台缩放
- **表格样式**（`simple-table`）：表头开关、对齐、加粗、边框色/宽、表头背景、斑马纹；JSON 仍可改数据

## Run

```bash
npm install
npm run dev -- --host 0.0.0.0
# → http://localhost:5173
```

```bash
npm run build
```

Local dev uses Vite `base: '/'`. CI sets `GITHUB_ACTIONS` so production builds use `base: '/vslide-cn-react/'` for the GitHub Pages project site.

## GitHub Pages

**Live URL:** https://shalom-lab.github.io/vslide-cn-react/

CI/CD: every push to `main` runs [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) (`npm ci` → `npm run build` → upload Pages artifact → deploy). SPA routes (`/edit`, `/play`) work on refresh via a `404.html` copy of `index.html` (GitHub Pages serves that for unknown paths).

### One-time enable (if not already on)

1. Open **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Re-run the **Deploy GitHub Pages** workflow if the first deploy waited on Pages being enabled (`Actions` → workflow → **Re-run**)

Private repos need a plan that includes GitHub Pages (Pro / Team / Enterprise). Site visibility follows your Pages visibility setting.

## Blueprint notes

See [docs/blueprint-notes.md](./docs/blueprint-notes.md).

## Stable JSON (Agent skills)

Deck / atom field names stay aligned with vslide-vue (`fileType: vslideFile`, `atomContent.atomName`, `detail.sheetData` + `nr`/`nc`, …). Prefer extending the registry over inventing parallel shapes.

### Safe HTML atoms

`text-md` and `custom-html` always run HTML through `src/utils/sanitizeHtml.ts` (DOMPurify) before `dangerouslySetInnerHTML`. They **never execute JavaScript** (no `<script>`, no `on*` handlers, no `javascript:` URLs, no iframes). Insert via TopBar **文字** / **HTML** (place-first → right drawer).

## Deferred

CloudBase login/share · Handsontable · full animation timeline · full chart zoo · Electron · richer 模板图表 / 我的图表 galleries.
