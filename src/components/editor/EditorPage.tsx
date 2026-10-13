import { Canvas } from './Canvas'
import { PropertyPanel } from './PropertyPanel'
import { SlideList } from './SlideList'
import { Toolbar } from './Toolbar'
import { TopBar } from './TopBar'

export function EditorPage() {
  return (
    <div className="editor-page">
      <Toolbar />
      <TopBar />
      <main className="editor-main">
        <SlideList />
        <div className="editor-center">
          <Canvas />
        </div>
        <PropertyPanel />
      </main>
      <footer className="footer">www.vslide.cn · React 重写</footer>
    </div>
  )
}
