import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Code2,
  Image as ImageIcon,
  LayoutTemplate,
  MonitorPlay,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Settings,
  Shapes,
  Table2,
  Type,
  Undo2,
} from 'lucide-react'
import {
  createImageAtom,
  useDeckStore,
} from '../../store/useDeckStore'
import { ChartInsertDrawer } from './ChartInsertDrawer'
import { TextInsertDrawer } from './TextInsertDrawer'
import { BackgroundDrawer } from './BackgroundDrawer'
import { TemplateDrawer } from './TemplateDrawer'
import { IconInsertDrawer } from './IconInsertDrawer'
import { SettingsDrawer } from './SettingsDrawer'

const I = { size: 20, strokeWidth: 1.75 }

export function TopBar() {
  const addSlide = useDeckStore((s) => s.addSlide)
  const addAtom = useDeckStore((s) => s.addAtom)
  const setActiveAtom = useDeckStore((s) => s.setActiveAtom)
  const setEditorFocus = useDeckStore((s) => s.setEditorFocus)
  const undo = useDeckStore((s) => s.undo)
  const redo = useDeckStore((s) => s.redo)
  const pastLen = useDeckStore((s) => s.past.length)
  const futureLen = useDeckStore((s) => s.future.length)
  const placeMode = useDeckStore((s) => s.placeMode)
  const pendingLayout = useDeckStore((s) => s.pendingLayout)
  const chartDrawerOpen = useDeckStore((s) => s.chartDrawerOpen)
  const textDrawerOpen = useDeckStore((s) => s.textDrawerOpen)
  const iconDrawerOpen = useDeckStore((s) => s.iconDrawerOpen)
  const startChartPlace = useDeckStore((s) => s.startChartPlace)
  const startTextPlace = useDeckStore((s) => s.startTextPlace)
  const startHtmlPlace = useDeckStore((s) => s.startHtmlPlace)
  const startTablePlace = useDeckStore((s) => s.startTablePlace)
  const startImagePlace = useDeckStore((s) => s.startImagePlace)
  const startIconPlace = useDeckStore((s) => s.startIconPlace)
  const cancelPlaceMode = useDeckStore((s) => s.cancelPlaceMode)
  const setChartDrawerOpen = useDeckStore((s) => s.setChartDrawerOpen)
  const setTextDrawerOpen = useDeckStore((s) => s.setTextDrawerOpen)
  const setIconDrawerOpen = useDeckStore((s) => s.setIconDrawerOpen)
  const fileRef = useRef<HTMLInputElement>(null)
  const [bgDrawerOpen, setBgDrawerOpen] = useState(false)
  const [tplDrawerOpen, setTplDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const chartActive = placeMode === 'chart' || chartDrawerOpen
  // placeMode stays set while the right drawer is open, so these cover both drag + chooser
  const textActive = placeMode === 'text'
  const htmlActive = placeMode === 'html'
  const tableActive = placeMode === 'table'
  const imageActive = placeMode === 'image'
  const iconActive = placeMode === 'icon' || iconDrawerOpen

  // Place-first image: after drag-rect, open the file picker into pendingLayout
  useEffect(() => {
    if (placeMode !== 'image' || !pendingLayout) return
    // Defer so the place-rect paints before the native dialog steals focus
    const t = window.setTimeout(() => fileRef.current?.click(), 0)
    return () => window.clearTimeout(t)
  }, [placeMode, pendingLayout])

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const layout = useDeckStore.getState().pendingLayout ?? undefined
    e.target.value = ''
    if (!file) {
      // Dialog dismissed without a file — stay in place mode until Esc / re-pick
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      addAtom(createImageAtom(String(reader.result), layout))
    }
    reader.readAsDataURL(file)
  }

  const onChartClick = () => {
    if (chartActive) {
      cancelPlaceMode()
      return
    }
    startChartPlace()
  }

  const onTextClick = () => {
    if (textActive) {
      cancelPlaceMode()
      return
    }
    startTextPlace()
  }

  const onHtmlClick = () => {
    if (htmlActive) {
      cancelPlaceMode()
      return
    }
    startHtmlPlace()
  }

  const onTableClick = () => {
    if (tableActive) {
      cancelPlaceMode()
      return
    }
    startTablePlace()
  }

  const onImageClick = () => {
    if (imageActive) {
      // Rect already placed — re-open file picker; Esc / empty-click cancels
      if (pendingLayout) {
        fileRef.current?.click()
        return
      }
      cancelPlaceMode()
      return
    }
    startImagePlace()
  }

  const onIconClick = () => {
    if (iconActive) {
      cancelPlaceMode()
      return
    }
    startIconPlace()
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button type="button" className="icon-btn" onClick={addSlide} title="新建幻灯片">
            <span className="icon">
              <Plus {...I} />
            </span>
            <span className="label">新建幻灯片</span>
          </button>
          <span className="topbar-sep" aria-hidden />
          <button
            type="button"
            className="icon-btn"
            disabled={pastLen === 0}
            onClick={undo}
            title="撤销 Ctrl+Z"
          >
            <span className="icon">
              <Undo2 {...I} />
            </span>
            <span className="label">撤销</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={futureLen === 0}
            onClick={redo}
            title="重做 Ctrl+Y"
          >
            <span className="icon">
              <Redo2 {...I} />
            </span>
            <span className="label">重做</span>
          </button>
        </div>
        <div className="topbar-mode">
          <Link to="/play" className="icon-btn" title="放映">
            <span className="icon">
              <MonitorPlay {...I} />
            </span>
            <span className="label">放映</span>
          </Link>
          <Link to="/edit" className="icon-btn active" title="编辑">
            <span className="icon">
              <Pencil {...I} />
            </span>
            <span className="label">编辑</span>
          </Link>
        </div>
        <div className="topbar-atoms">
          <button
            type="button"
            className={'icon-btn' + (chartActive ? ' active' : '')}
            onClick={onChartClick}
            title="在画布拖框后插入图表"
          >
            <span className="icon">
              <BarChart3 {...I} />
            </span>
            <span className="label">图表</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (textActive ? ' active' : '')}
            onClick={onTextClick}
            title="在画布拖框后于右侧选择正文或标题"
          >
            <span className="icon">
              <Type {...I} />
            </span>
            <span className="label">文字</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (tableActive ? ' active' : '')}
            onClick={onTableClick}
            title="在画布拖框后插入表格"
          >
            <span className="icon">
              <Table2 {...I} />
            </span>
            <span className="label">表格</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (htmlActive ? ' active' : '')}
            onClick={onHtmlClick}
            title="在画布拖框后于右侧插入安全 HTML"
          >
            <span className="icon">
              <Code2 {...I} />
            </span>
            <span className="label">HTML</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (imageActive ? ' active' : '')}
            onClick={onImageClick}
            title="在画布拖框后选择图片"
          >
            <span className="icon">
              <ImageIcon {...I} />
            </span>
            <span className="label">图片</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (iconActive ? ' active' : '')}
            onClick={onIconClick}
            title="在画布拖框后选择图标"
          >
            <span className="icon">
              <Shapes {...I} />
            </span>
            <span className="label">图标</span>
          </button>
          <span className="topbar-sep" aria-hidden />
          <button
            type="button"
            className={'icon-btn' + (tplDrawerOpen ? ' active' : '')}
            onClick={() => {
              setActiveAtom(null)
              setEditorFocus(null)
              setTplDrawerOpen(true)
            }}
            title="插入幻灯片模板"
          >
            <span className="icon">
              <LayoutTemplate {...I} />
            </span>
            <span className="label">模板</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (bgDrawerOpen ? ' active' : '')}
            onClick={() => {
              setActiveAtom(null)
              setEditorFocus(null)
              setBgDrawerOpen(true)
            }}
            title="幻灯片背景"
          >
            <span className="icon">
              <Palette {...I} />
            </span>
            <span className="label">背景</span>
          </button>
          <button
            type="button"
            className={'icon-btn' + (settingsOpen ? ' active' : '')}
            onClick={() => {
              setActiveAtom(null)
              setEditorFocus(null)
              setSettingsOpen(true)
            }}
            title="设置"
          >
            <span className="icon">
              <Settings {...I} />
            </span>
            <span className="label">设置</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onImage}
          />
        </div>
      </div>
      <ChartInsertDrawer
        open={chartDrawerOpen}
        onClose={() => setChartDrawerOpen(false)}
      />
      <TextInsertDrawer
        open={textDrawerOpen}
        onClose={() => setTextDrawerOpen(false)}
      />
      <BackgroundDrawer
        open={bgDrawerOpen}
        onClose={() => setBgDrawerOpen(false)}
      />
      <TemplateDrawer
        open={tplDrawerOpen}
        onClose={() => setTplDrawerOpen(false)}
      />
      <IconInsertDrawer
        open={iconDrawerOpen}
        onClose={() => setIconDrawerOpen(false)}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
