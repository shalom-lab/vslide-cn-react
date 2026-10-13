import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Code2,
  Image as ImageIcon,
  MonitorPlay,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Table2,
  Type,
  Undo2,
} from 'lucide-react'
import {
  createCustomHtmlAtom,
  createImageAtom,
  createTableAtom,
  useDeckStore,
} from '../../store/useDeckStore'
import { ChartInsertDrawer } from './ChartInsertDrawer'
import { TextInsertChooser } from './TextInsertChooser'
import { BackgroundDrawer } from './BackgroundDrawer'

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
  const chartDrawerOpen = useDeckStore((s) => s.chartDrawerOpen)
  const textChooserOpen = useDeckStore((s) => s.textChooserOpen)
  const startChartPlace = useDeckStore((s) => s.startChartPlace)
  const startTextPlace = useDeckStore((s) => s.startTextPlace)
  const cancelPlaceMode = useDeckStore((s) => s.cancelPlaceMode)
  const setChartDrawerOpen = useDeckStore((s) => s.setChartDrawerOpen)
  const setTextChooserOpen = useDeckStore((s) => s.setTextChooserOpen)
  const fileRef = useRef<HTMLInputElement>(null)
  const [bgDrawerOpen, setBgDrawerOpen] = useState(false)

  const chartActive = placeMode === 'chart' || chartDrawerOpen
  const textActive = placeMode === 'text' || textChooserOpen

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      addAtom(createImageAtom(String(reader.result)))
      e.target.value = ''
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
            title="在画布拖框后选择正文或标题"
          >
            <span className="icon">
              <Type {...I} />
            </span>
            <span className="label">文字</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => addAtom(createTableAtom())}
            title="插入表格"
          >
            <span className="icon">
              <Table2 {...I} />
            </span>
            <span className="label">表格</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => addAtom(createCustomHtmlAtom())}
            title="插入安全 HTML（不执行 JS）"
          >
            <span className="icon">
              <Code2 {...I} />
            </span>
            <span className="label">HTML</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileRef.current?.click()}
            title="插入图片"
          >
            <span className="icon">
              <ImageIcon {...I} />
            </span>
            <span className="label">图片</span>
          </button>
          <span className="topbar-sep" aria-hidden />
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
      <TextInsertChooser
        open={textChooserOpen}
        onClose={() => setTextChooserOpen(false)}
      />
      <BackgroundDrawer
        open={bgDrawerOpen}
        onClose={() => setBgDrawerOpen(false)}
      />
    </>
  )
}
