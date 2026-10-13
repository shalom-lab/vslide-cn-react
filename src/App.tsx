import { Navigate, Route, Routes } from 'react-router-dom'
import { EditorPage } from './components/editor/EditorPage'
import { PlayPage } from './components/play/PlayPage'
import { Link } from 'react-router-dom'
import { useDeckStore } from './store/useDeckStore'
import { BrandLogo } from './components/BrandLogo'
import './styles/app.css'

function HomePage() {
  const fileName = useDeckStore((s) => s.deck.fileName)
  const n = useDeckStore((s) => s.deck.slides.length)
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo">
          <BrandLogo size={28} withText />
        </div>
        <span style={{ color: '#888', fontSize: 13 }}>
          React + TypeScript 重写 · 蓝本 vslide-vue
        </span>
      </header>
      <div className="home-body">
        <nav className="home-side">
          <div className="nav-item active">演示文稿</div>
          <div className="nav-item" style={{ opacity: 0.45 }}>
            模板图表（稍后）
          </div>
          <div className="nav-item" style={{ opacity: 0.45 }}>
            我的图表（稍后）
          </div>
        </nav>
        <div className="home-main">
          <h1>演示文稿</h1>
          <p>
            紧凑布局：左侧幻灯片 · 中间 16:9 画布 · 右侧属性。图表抽屉插入堆叠/条形/散点。
            放映 ←→ / Space · Esc 编辑 · Ctrl+Z 撤销。
          </p>
          <div className="home-cards">
            <Link to="/edit" className="home-card">
              <h3>{fileName}</h3>
              <p>{n} 页示例文稿 · 点击进入编辑</p>
            </Link>
            <Link to="/play" className="home-card">
              <h3>立即放映</h3>
              <p>全屏播放当前示例</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/edit" element={<EditorPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
