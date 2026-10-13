import { useState } from 'react'
import { Navigate, Route, Routes, Link } from 'react-router-dom'
import { requestAppFullscreen } from './utils/fullscreen'
import { EditorPage } from './components/editor/EditorPage'
import { PlayPage } from './components/play/PlayPage'
import { useDeckStore } from './store/useDeckStore'
import { BrandLogo } from './components/BrandLogo'
import { AtomRenderer } from './components/atoms/AtomRenderer'
import './styles/app.css'

type HomeNav = 'decks' | 'mine'

function HomePage() {
  const fileName = useDeckStore((s) => s.deck.fileName)
  const n = useDeckStore((s) => s.deck.slides.length)
  const localGallery = useDeckStore((s) => s.localGallery)
  const removeLocalGalleryItem = useDeckStore((s) => s.removeLocalGalleryItem)
  const renameLocalGalleryItem = useDeckStore((s) => s.renameLocalGalleryItem)
  const [nav, setNav] = useState<HomeNav>('decks')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

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
          <button
            type="button"
            className={'nav-item' + (nav === 'decks' ? ' active' : '')}
            onClick={() => setNav('decks')}
          >
            演示文稿
          </button>
          <div className="nav-item" style={{ opacity: 0.45 }} title="模板图表稍后">
            模板图表（稍后）
          </div>
          <button
            type="button"
            className={'nav-item' + (nav === 'mine' ? ' active' : '')}
            onClick={() => setNav('mine')}
          >
            我的图表
            {localGallery.length > 0 ? ` (${localGallery.length})` : ''}
          </button>
        </nav>
        <div className="home-main">
          {nav === 'decks' ? (
            <>
              <h1>演示文稿</h1>
              <p>
                紧凑布局：左侧幻灯片 · 中间 16:9 画布 · 右侧属性。图表抽屉可插入内置图与「我的图表」。
                放映 ←→ / Space · Esc 编辑 · Ctrl+Z 撤销。
              </p>
              <div className="home-cards">
                <Link to="/edit" className="home-card">
                  <h3>{fileName}</h3>
                  <p>{n} 页示例文稿 · 点击进入编辑</p>
                </Link>
                <Link
                  to="/play"
                  className="home-card"
                  onClick={() => requestAppFullscreen()}
                >
                  <h3>立即放映</h3>
                  <p>全屏播放当前示例</p>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>我的图表</h1>
              <p>
                保存在本机 localStorage（无云端）。编辑页右键元素「保存」可收藏；顶部「图表」抽屉 →「我的」可插入到画布。
              </p>
              {localGallery.length === 0 ? (
                <p className="muted" style={{ marginTop: 24 }}>
                  暂无收藏。进入编辑后，右键图表 / 文字 / 表格等 →「保存」。
                </p>
              ) : (
                <div className="home-gallery-grid">
                  {localGallery.map((item) => (
                    <div key={item.id} className="home-gallery-card">
                      <div className="home-gallery-stage">
                        <AtomRenderer
                          atom={{
                            ...item.atom,
                            i: `home-g-${item.id}`,
                            atomBorder: {
                              width: 0,
                              type: 'solid',
                              color: '#808080',
                              radius: 1,
                            },
                          }}
                        />
                      </div>
                      <div className="home-gallery-meta">
                        {renamingId === item.id ? (
                          <input
                            className="gallery-rename-input"
                            value={renameDraft}
                            autoFocus
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const name = renameDraft.trim()
                                if (name) renameLocalGalleryItem(item.id, name)
                                setRenamingId(null)
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                setRenamingId(null)
                              }
                            }}
                            onBlur={() => {
                              const name = renameDraft.trim()
                              if (name) renameLocalGalleryItem(item.id, name)
                              setRenamingId(null)
                            }}
                          />
                        ) : (
                          <strong>{item.name}</strong>
                        )}
                        <span>{item.atom.atomContent.atomName}</span>
                      </div>
                      <div className="home-gallery-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setRenamingId(item.id)
                            setRenameDraft(item.name)
                          }}
                        >
                          重命名
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => removeLocalGalleryItem(item.id)}
                        >
                          删除
                        </button>
                        <Link to="/edit" className="btn-primary home-gallery-use">
                          去编辑插入
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
