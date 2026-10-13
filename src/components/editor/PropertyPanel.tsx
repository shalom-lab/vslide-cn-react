import { useCallback, useEffect, useRef, useState } from 'react'
import {
  selectActiveAtom,
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { canLayerAction } from '../../utils/layerOrder'
import { ANIM_ENTER_OPTIONS } from '../../editor/editorOption'
import { SheetDataEditor } from './SheetDataEditor'
import { RecursivePropEditor } from './RecursivePropEditor'
import 'animate.css'

export function PropertyPanel() {
  const atom = useDeckStore(selectActiveAtom)
  const slide = useDeckStore(selectActiveSlide)
  const bg = useDeckStore((s) => s.deck.background)
  const editorFocus = useDeckStore((s) => s.editorFocus)
  const updateAtomDetail = useDeckStore((s) => s.updateAtomDetail)
  const patchAtomPath = useDeckStore((s) => s.patchAtomPath)
  const removeActiveAtom = useDeckStore((s) => s.removeActiveAtom)
  const toggleFixedActiveAtom = useDeckStore((s) => s.toggleFixedActiveAtom)
  const duplicateActiveAtom = useDeckStore((s) => s.duplicateActiveAtom)
  const reorderActiveAtom = useDeckStore((s) => s.reorderActiveAtom)
  const setBackground = useDeckStore((s) => s.setBackground)
  const updateSlideAnimation = useDeckStore((s) => s.updateSlideAnimation)
  const activeSlideId = useDeckStore((s) => s.activeSlideId)

  const sheetRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<HTMLDivElement>(null)
  const [animPreview, setAnimPreview] = useState(true)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (!editorFocus || !atom) return
    const map = {
      sheetData: sheetRef,
      atomContent: styleRef,
      atomBorder: borderRef,
      atomAnimation: animRef,
    } as const
    const el = map[editorFocus]?.current
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [editorFocus, atom])

  // Replay enter animation preview when enter class changes
  useEffect(() => {
    if (!atom?.atomAnimation.enter) return
    setAnimPreview(false)
    const t = window.setTimeout(() => {
      setAnimKey((k) => k + 1)
      setAnimPreview(true)
    }, 30)
    return () => window.clearTimeout(t)
  }, [atom?.atomAnimation.enter, atom?.i])

  const onPathChange = useCallback(
    (fullPath: string, value: unknown) => {
      if (!atom) return
      patchAtomPath(activeSlideId, atom.i, fullPath, value)
    },
    [atom, activeSlideId, patchAtomPath],
  )

  if (!atom) {
    return (
      <aside className="props">
        <h3>属性</h3>
        <p className="muted">选中画布中的组件以编辑属性（右键打开菜单）</p>
        <h4>幻灯片背景</h4>
        <div
          className="bg-props-preview"
          style={{ background: cssBackground(bg) }}
          title={bg.mode}
        />
        <p className="hint">
          点顶部工具栏「背景」打开 PPT 风格模板库（预设 / 自定义 / 我的）。
        </p>
        <label className="field">
          快捷 · 纯色
          <input
            type="color"
            value={rgbToHex(bg.pure) || '#f7f4ef'}
            onChange={(e) =>
              setBackground({ ...bg, mode: 'pure', pure: e.target.value })
            }
          />
        </label>
        {slide && (
          <>
            <h4>幻灯片动画</h4>
            <label className="field">
              进入
              <select
                value={slide.slideAnimation.enter}
                onChange={(e) =>
                  updateSlideAnimation(activeSlideId, { enter: e.target.value })
                }
              >
                {ANIM_ENTER_OPTIONS.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <p className="hint">
          当前幻灯片 #{slide ? slide.y + 1 : '-'} ·{' '}
          {slide?.slideContent.length ?? 0} 个组件 · 模式 {bg.mode}
        </p>
      </aside>
    )
  }

  const d = atom.atomContent.detail
  const hasSheet =
    atom.atomType === 'echart' || atom.atomType === 'tables'

  return (
    <aside className="props">
      <h3>属性</h3>
      <p className="atom-meta">
        {atom.atomType} / {atom.atomContent.atomName}
        {atom.static ? ' · 已固定' : ''}
        {atom.super ? ' · super' : ''}
        {typeof atom.zIndex === 'number' ? ` · 层 ${atom.zIndex}` : ''}
      </p>

      <h4>图层</h4>
      <div className="layer-btns">
        {(
          [
            ['front', '置顶'],
            ['forward', '上移'],
            ['backward', '下移'],
            ['back', '置底'],
          ] as const
        ).map(([action, label]) => (
          <button
            key={action}
            type="button"
            className="btn-secondary layer-btn"
            disabled={
              atom.super ||
              !canLayerAction(slide?.slideContent ?? [], atom.i, action)
            }
            onClick={() => reorderActiveAtom(action)}
          >
            {label}
          </button>
        ))}
      </div>

      {hasSheet && (
        <div
          ref={sheetRef}
          className={
            'props-section' +
            (editorFocus === 'sheetData' ? ' focus-flash' : '')
          }
        >
          <SheetDataEditor
            data={(d.sheetData as (string | number)[][]) ?? []}
            focused={editorFocus === 'sheetData'}
            onChange={(sheetData, nr, nc) =>
              updateAtomDetail(activeSlideId, atom.i, { sheetData, nr, nc })
            }
          />
        </div>
      )}

      <div
        ref={styleRef}
        className={
          'props-section' +
          (editorFocus === 'atomContent' ? ' focus-flash' : '')
        }
      >
        <h4>内容 / 样式</h4>
        <RecursivePropEditor
          obj={d as Record<string, unknown>}
          prefix="atomContent.detail"
          optionKey={String(atom.atomContent.atomName)}
          onChange={onPathChange}
        />
      </div>

      <div
        ref={borderRef}
        className={
          'props-section' +
          (editorFocus === 'atomBorder' ? ' focus-flash' : '')
        }
      >
        <h4>边框</h4>
        <RecursivePropEditor
          obj={atom.atomBorder as unknown as Record<string, unknown>}
          prefix="atomBorder"
          optionKey="atomBorder"
          onChange={onPathChange}
        />
      </div>

      <div
        ref={animRef}
        className={
          'props-section' +
          (editorFocus === 'atomAnimation' ? ' focus-flash' : '')
        }
      >
        <h4>动画</h4>
        <RecursivePropEditor
          obj={atom.atomAnimation as unknown as Record<string, unknown>}
          prefix="atomAnimation"
          optionKey="atomAnimation"
          onChange={onPathChange}
        />
        <div className="anim-preview-card">
          <p className="hint">进入预览（animate.css）</p>
          {animPreview && atom.atomAnimation.enter !== 'none' ? (
            <h3
              key={animKey}
              className={`animate__animated animate__${atom.atomAnimation.enter}`}
            >
              VSlide 微思文稿
            </h3>
          ) : (
            <h3>VSlide 微思文稿</h3>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setAnimPreview(false)
              window.setTimeout(() => {
                setAnimKey((k) => k + 1)
                setAnimPreview(true)
              }, 30)
            }}
          >
            重播
          </button>
        </div>
        {slide && (
          <>
            <h5 className="recursive-block-title">幻灯片动画</h5>
            <label className="field">
              进入
              <select
                value={slide.slideAnimation.enter}
                onChange={(e) =>
                  updateSlideAnimation(activeSlideId, { enter: e.target.value })
                }
              >
                {ANIM_ENTER_OPTIONS.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <div className="props-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={toggleFixedActiveAtom}
        >
          {atom.static ? '取消固定' : '固定'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={duplicateActiveAtom}
        >
          复制
        </button>
        <button type="button" className="btn-danger" onClick={removeActiveAtom}>
          删除组件
        </button>
      </div>
    </aside>
  )
}

function rgbToHex(input: string): string | null {
  if (input.startsWith('#')) return input.slice(0, 7)
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1]!)}${hex(m[2]!)}${hex(m[3]!)}`
}
