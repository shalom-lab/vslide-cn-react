import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createImageAtom,
  createTableAtom,
  createTextAtom,
  createTextShadowAtom,
  useDeckStore,
} from '../../store/useDeckStore'
import { ChartInsertDrawer } from './ChartInsertDrawer'

export function TopBar() {
  const addSlide = useDeckStore((s) => s.addSlide)
  const addAtom = useDeckStore((s) => s.addAtom)
  const setActiveAtom = useDeckStore((s) => s.setActiveAtom)
  const setEditorFocus = useDeckStore((s) => s.setEditorFocus)
  const undo = useDeckStore((s) => s.undo)
  const redo = useDeckStore((s) => s.redo)
  const pastLen = useDeckStore((s) => s.past.length)
  const futureLen = useDeckStore((s) => s.future.length)
  const fileRef = useRef<HTMLInputElement>(null)
  const [chartOpen, setChartOpen] = useState(false)
  const closeChart = useCallback(() => setChartOpen(false), [])

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

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button type="button" className="icon-btn" onClick={addSlide}>
            <span className="icon">＋</span>
            <span className="label">新建幻灯片</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={pastLen === 0}
            onClick={undo}
            title="撤销 Ctrl+Z"
          >
            <span className="icon">↶</span>
            <span className="label">撤销</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={futureLen === 0}
            onClick={redo}
            title="重做 Ctrl+Y"
          >
            <span className="icon">↷</span>
            <span className="label">重做</span>
          </button>
        </div>
        <div className="topbar-mode">
          <Link to="/play" className="icon-btn">
            <span className="icon">▶</span>
            <span className="label">放映</span>
          </Link>
          <Link to="/edit" className="icon-btn active">
            <span className="icon">✎</span>
            <span className="label">编辑</span>
          </Link>
        </div>
        <div className="topbar-atoms">
          <button
            type="button"
            className={'icon-btn' + (chartOpen ? ' active' : '')}
            onClick={() => setChartOpen(true)}
            title="打开图表库"
          >
            <span className="icon">📊</span>
            <span className="label">图表</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => addAtom(createTextAtom())}
          >
            <span className="icon">T</span>
            <span className="label">文本</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => addAtom(createTextShadowAtom())}
          >
            <span className="icon">🅣</span>
            <span className="label">标题</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => addAtom(createTableAtom())}
          >
            <span className="icon">▦</span>
            <span className="label">表格</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileRef.current?.click()}
          >
            <span className="icon">🖼</span>
            <span className="label">图片</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              setActiveAtom(null)
              setEditorFocus(null)
            }}
          >
            <span className="icon">⚙</span>
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
      <ChartInsertDrawer open={chartOpen} onClose={closeChart} />
    </>
  )
}
