import { useEffect } from 'react'
import { useDeckStore } from '../../store/useDeckStore'
import { Canvas } from './Canvas'
import { PropertyPanel } from './PropertyPanel'
import { SlideList } from './SlideList'
import { Toolbar } from './Toolbar'
import { TopBar } from './TopBar'

export function EditorPage() {
  const undo = useDeckStore((s) => s.undo)
  const redo = useDeckStore((s) => s.redo)
  const removeActiveAtom = useDeckStore((s) => s.removeActiveAtom)
  const duplicateActiveAtom = useDeckStore((s) => s.duplicateActiveAtom)
  const activeAtomId = useDeckStore((s) => s.activeAtomId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const editing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable

      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (editing) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && activeAtomId) {
        e.preventDefault()
        removeActiveAtom()
      }
      if (mod && e.key.toLowerCase() === 'd' && activeAtomId) {
        e.preventDefault()
        duplicateActiveAtom()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, removeActiveAtom, duplicateActiveAtom, activeAtomId])

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
      <footer className="footer">www.vslide.cn · React 重写 · Ctrl+Z 撤销</footer>
    </div>
  )
}
