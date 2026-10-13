import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  createChartAtom,
  createImageAtom,
  createTableAtom,
  createTextAtom,
  useDeckStore,
} from '../../store/useDeckStore'

export function TopBar() {
  const addSlide = useDeckStore((s) => s.addSlide)
  const addAtom = useDeckStore((s) => s.addAtom)
  const fileRef = useRef<HTMLInputElement>(null)

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
    <div className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn" onClick={addSlide}>
          <span className="icon">＋</span>
          <span className="label">新建幻灯片</span>
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
          className="icon-btn"
          onClick={() => addAtom(createChartAtom('simple-line'))}
        >
          <span className="icon">📈</span>
          <span className="label">折线</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => addAtom(createChartAtom('simple-bar'))}
        >
          <span className="icon">📊</span>
          <span className="label">柱状</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => addAtom(createChartAtom('simple-pie'))}
        >
          <span className="icon">◔</span>
          <span className="label">饼图</span>
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onImage}
        />
      </div>
    </div>
  )
}
