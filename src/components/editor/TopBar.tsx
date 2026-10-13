import { useRef, useState } from 'react'
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
import { useDeckStore } from '../../store/useDeckStore'
import { ChartInsertDrawer } from './ChartInsertDrawer'
import { TextInsertDrawer } from './TextInsertDrawer'
import { BackgroundDrawer } from './BackgroundDrawer'
import { TemplateDrawer } from './TemplateDrawer'
import { IconInsertDrawer } from './IconInsertDrawer'
import { SettingsDrawer } from './SettingsDrawer'

const I = { size: 20, strokeWidth: 1.75 }

export function TopBar() {
  const addSlide = useDeckStore((s) => s.addSlide)
  const setActiveAtom = useDeckStore((s) => s.setActiveAtom)
  const setEditorFocus = useDeckStore((s) => s.setEditorFocus)
  const undo = useDeckStore((s) => s.undo)
  const redo = useDeckStore((s) => s.redo)
  const pastLen = useDeckStore((s) => s.past.length)
  const futureLen = useDeckStore((s) => s.future.length)
  const placeMode = useDeckStore((s) => s.placeMode)
  const chartDrawerOpen = useDeckStore((s) => s.chartDrawerOpen)
  const textDrawerOpen = useDeckStore((s) => s.textDrawerOpen)
  const iconDrawerOpen = useDeckStore((s) => s.iconDrawerOpen)
  const startChartPlace = useDeckStore((s) => s.startChartPlace)
  const startTextPlace = useDeckStore((s) => s.startTextPlace)
  const startHtmlPlace = useDeckStore((s) => s.startHtmlPlace)
  const startTablePlace = useDeckStore((s) => s.startTablePlace)
  const startImagePlace = useDeckStore((s) => s.startImagePlace)
  const startIconPlace = useDeckStore((s) => s.startIconPlace)
  const armPendingInsert = useDeckStore((s) => s.armPendingInsert)
  const cancelPlaceMode = useDeckStore((s) => s.cancelPlaceMode)
  const setChartDrawerOpen = useDeckStore((s) => s.setChartDrawerOpen)
  const setTextDrawerOpen = useDeckStore((s) => s.setTextDrawerOpen)
  const setIconDrawerOpen = useDeckStore((s) => s.setIconDrawerOpen)
  const fileRef = useRef<HTMLInputElement>(null)
  const [bgDrawerOpen, setBgDrawerOpen] = useState(false)
  const [tplDrawerOpen, setTplDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** True while waiting for native file dialog after clicking 图片. */
  const [imagePicking, setImagePicking] = useState(false)

  const chartActive = placeMode === 'chart' || chartDrawerOpen
  const textActive = placeMode === 'text' || textDrawerOpen
  const htmlActive = placeMode === 'html'
  const tableActive = placeMode === 'table'
  const imageActive = placeMode === 'image' || imagePicking
  const iconActive = placeMode === 'icon' || iconDrawerOpen

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith('image/'),
    )
    e.target.value = ''
    setImagePicking(false)
    if (files.length === 0) {
      // Dialog dismissed — leave idle (type-first: no place mode without files)
      return
    }

    const readAll = (list: File[]) =>
      Promise.all(
        list.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(String(reader.result))
              reader.onerror = () => reject(reader.error)
              reader.readAsDataURL(file)
            }),
        ),
      )

    void readAll(files).then((srcs) => {
      // Arm image(s) then drag on canvas to place (single or multi)
      armPendingInsert({ kind: 'image', srcs })
    })
  }

  const onChartClick = () => {
    if (chartActive) {
      cancelPlaceMode()
      return
    }
    startChartPlace()
  }

  const onTextClick = () => {
    if (textActive && !htmlActive) {
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
    // Same drawer as text — user picks HTML there
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
      cancelPlaceMode()
      setImagePicking(false)
      return
    }
    startImagePlace()
    setImagePicking(true)
    // Defer so toolbar click settles before native dialog
    window.setTimeout(() => fileRef.current?.click(), 0)
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
            title="先选图表类型，再拖框放置"
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
            title="先选文字类型，再拖框放置"
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
            title="选择后在画布拖框放置表格"
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
            title="先选 HTML，再拖框放置"
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
            title="先选图片（可多选），再拖框放置"
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
            title="先选图标，再拖框放置"
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
            multiple
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
