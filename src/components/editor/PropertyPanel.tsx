import {
  selectActiveAtom,
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import { defaultBackground } from '../../types/deck'

export function PropertyPanel() {
  const atom = useDeckStore(selectActiveAtom)
  const slide = useDeckStore(selectActiveSlide)
  const bg = useDeckStore((s) => s.deck.background)
  const updateAtomDetail = useDeckStore((s) => s.updateAtomDetail)
  const updateAtom = useDeckStore((s) => s.updateAtom)
  const removeActiveAtom = useDeckStore((s) => s.removeActiveAtom)
  const setBackground = useDeckStore((s) => s.setBackground)
  const activeSlideId = useDeckStore((s) => s.activeSlideId)

  if (!atom) {
    return (
      <aside className="props">
        <h3>属性</h3>
        <p className="muted">选中画布中的组件以编辑属性</p>
        <h4>幻灯片背景</h4>
        <label className="field">
          模式
          <select
            value={bg.mode}
            onChange={(e) =>
              setBackground({
                ...bg,
                mode: e.target.value as typeof bg.mode,
              })
            }
          >
            <option value="pure">纯色</option>
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
            <option value="custom">自定义</option>
          </select>
        </label>
        {bg.mode === 'pure' && (
          <label className="field">
            颜色
            <input
              type="color"
              value={rgbToHex(bg.pure) || '#f9f9f9'}
              onChange={(e) =>
                setBackground({ ...bg, pure: e.target.value })
              }
            />
          </label>
        )}
        {bg.mode === 'custom' && (
          <label className="field">
            CSS
            <input
              value={bg.custom}
              onChange={(e) =>
                setBackground({ ...bg, custom: e.target.value })
              }
            />
          </label>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setBackground(defaultBackground())}
        >
          重置背景
        </button>
        <p className="hint">
          当前幻灯片 #{slide ? slide.y + 1 : '-'} ·{' '}
          {slide?.slideContent.length ?? 0} 个组件
        </p>
      </aside>
    )
  }

  const d = atom.atomContent.detail

  return (
    <aside className="props">
      <h3>属性</h3>
      <p className="atom-meta">
        {atom.atomType} / {atom.atomContent.atomName}
      </p>

      {(atom.atomContent.atomName === 'text-md' ||
        atom.atomContent.atomName === 'text-title') && (
        <>
          {atom.atomContent.atomName === 'text-title' ? (
            <>
              <label className="field">
                标题
                <input
                  value={String(d.text ?? '')}
                  onChange={(e) =>
                    updateAtomDetail(activeSlideId, atom.i, {
                      text: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                字号
                <input
                  type="number"
                  value={Number(d.fontSize) || 28}
                  onChange={(e) =>
                    updateAtomDetail(activeSlideId, atom.i, {
                      fontSize: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                颜色
                <input
                  type="color"
                  value={String(d.color || '#2c3e50')}
                  onChange={(e) =>
                    updateAtomDetail(activeSlideId, atom.i, {
                      color: e.target.value,
                    })
                  }
                />
              </label>
            </>
          ) : (
            <label className="field">
              Markdown
              <textarea
                rows={10}
                value={String(d.markdown ?? '')}
                onChange={(e) =>
                  updateAtomDetail(activeSlideId, atom.i, {
                    markdown: e.target.value,
                  })
                }
              />
            </label>
          )}
        </>
      )}

      {atom.atomType === 'echart' && (
        <label className="field">
          标题
          <input
            value={String(d.title ?? '')}
            onChange={(e) =>
              updateAtomDetail(activeSlideId, atom.i, {
                title: e.target.value,
              })
            }
          />
        </label>
      )}

      {atom.atomType === 'echart' || atom.atomType === 'tables' ? (
        <label className="field">
          数据 (JSON 二维数组)
          <textarea
            rows={8}
            value={JSON.stringify(d.sheetData ?? [], null, 2)}
            onChange={(e) => {
              try {
                const sheetData = JSON.parse(e.target.value)
                if (Array.isArray(sheetData)) {
                  updateAtomDetail(activeSlideId, atom.i, { sheetData })
                }
              } catch {
                /* ignore while typing */
              }
            }}
          />
        </label>
      ) : null}

      {atom.atomType === 'images' && (
        <label className="field">
          图片 URL / DataURL
          <textarea
            rows={4}
            value={String(d.src ?? '')}
            onChange={(e) =>
              updateAtomDetail(activeSlideId, atom.i, { src: e.target.value })
            }
          />
        </label>
      )}

      <h4>边框</h4>
      <label className="field">
        宽度
        <input
          type="number"
          min={0}
          value={atom.atomBorder.width}
          onChange={(e) =>
            updateAtom(activeSlideId, atom.i, {
              atomBorder: {
                ...atom.atomBorder,
                width: Number(e.target.value),
              },
            })
          }
        />
      </label>
      <label className="field">
        颜色
        <input
          type="color"
          value={atom.atomBorder.color}
          onChange={(e) =>
            updateAtom(activeSlideId, atom.i, {
              atomBorder: { ...atom.atomBorder, color: e.target.value },
            })
          }
        />
      </label>

      <button
        type="button"
        className="btn-danger"
        onClick={removeActiveAtom}
      >
        删除组件
      </button>
    </aside>
  )
}

function rgbToHex(input: string): string | null {
  if (input.startsWith('#')) return input.slice(0, 7)
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
}
