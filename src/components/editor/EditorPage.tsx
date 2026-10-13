import { useEffect } from 'react'
import { useDeckStore } from '../../store/useDeckStore'
import { useResizablePanes } from '../../hooks/useResizablePanes'
import { Canvas } from './Canvas'
import { PropertyPanel } from './PropertyPanel'
import { SlideList } from './SlideList'
import { Toolbar } from './Toolbar'
import { TopBar } from './TopBar'

function PaneResizeHandle({
  side,
  active,
  onPointerDown,
  onDoubleClick,
}: {
  side: 'left' | 'right'
  active: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: () => void
}) {
  const label =
    side === 'left'
      ? '拖拽调节左侧幻灯片列表宽度，双击恢复默认'
      : '拖拽调节右侧属性面板宽度，双击恢复默认'
  return (
    <div
      className={`pane-resize-handle${active ? ' dragging' : ''}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    />
  )
}

export function EditorPage() {
  const undo = useDeckStore((s) => s.undo)
  const redo = useDeckStore((s) => s.redo)
  const removeActiveAtom = useDeckStore((s) => s.removeActiveAtom)
  const duplicateActiveAtom = useDeckStore((s) => s.duplicateActiveAtom)
  const activeAtomId = useDeckStore((s) => s.activeAtomId)
  const placeMode = useDeckStore((s) => s.placeMode)
  const chartDrawerOpen = useDeckStore((s) => s.chartDrawerOpen)
  const cancelPlaceMode = useDeckStore((s) => s.cancelPlaceMode)

  const {
    leftWidth,
    rightWidth,
    dragging,
    startDrag,
    onDoubleClick,
  } = useResizablePanes()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const editing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable

      // Place-first: Esc cancels (drawer has its own Esc when open)
      if (
        e.key === 'Escape' &&
        (placeMode || chartDrawerOpen) &&
        !chartDrawerOpen
      ) {
        e.preventDefault()
        cancelPlaceMode()
        return
      }

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
  }, [
    undo,
    redo,
    removeActiveAtom,
    duplicateActiveAtom,
    activeAtomId,
    placeMode,
    chartDrawerOpen,
    cancelPlaceMode,
  ])

  // Global cursor + select lock while dragging a pane handle
  useEffect(() => {
    if (!dragging) return
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.classList.add('pane-resizing')
    return () => {
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevSelect
      document.body.classList.remove('pane-resizing')
    }
  }, [dragging])

  return (
    <div className="editor-page">
      <Toolbar />
      <TopBar />
      <main
        className="editor-main"
        style={{
          gridTemplateColumns: `${leftWidth}px 5px 1fr 5px ${rightWidth}px`,
        }}
      >
        <SlideList />
        <PaneResizeHandle
          side="left"
          active={dragging === 'left'}
          onPointerDown={(e) => startDrag('left', e)}
          onDoubleClick={() => onDoubleClick('left')}
        />
        <div className="editor-center">
          <Canvas />
        </div>
        <PaneResizeHandle
          side="right"
          active={dragging === 'right'}
          onPointerDown={(e) => startDrag('right', e)}
          onDoubleClick={() => onDoubleClick('right')}
        />
        <PropertyPanel />
      </main>
      <footer className="footer">www.vslide.cn · React 重写 · Ctrl+Z 撤销</footer>
    </div>
  )
}
