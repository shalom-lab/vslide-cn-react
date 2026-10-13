import type { AtomContent } from '../../types/deck'

function asSrcList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || '')).filter(Boolean)
  }
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

/** Vue-compatible single-image + image-group (gallery) renderer. */
export function ImageAtom({ atomContent }: { atomContent: AtomContent }) {
  const name = String(atomContent.atomName || 'single-image')
  const detail = atomContent.detail || {}
  const srcs = asSrcList(detail.src)

  if (name === 'image-group' || srcs.length > 1) {
    const gap = Number(detail.gap)
    const gapPx = Number.isFinite(gap) ? gap : 5
    const height = Number(detail.height)
    const imgH = Number.isFinite(height) && height > 0 ? height : undefined

    return (
      <div
        className="image-group"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          alignContent: 'center',
          gap: gapPx,
          overflow: 'auto',
          boxSizing: 'border-box',
          padding: 4,
        }}
      >
        {srcs.length === 0 ? (
          <span style={{ color: '#999', fontSize: 13 }}>无图片</span>
        ) : (
          srcs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{
                height: imgH ? `${imgH}px` : 'auto',
                maxHeight: imgH ? undefined : '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                flex: imgH ? '0 0 auto' : '1 1 120px',
                minWidth: 0,
              }}
              draggable={false}
            />
          ))
        )}
      </div>
    )
  }

  const src = srcs[0] || ''
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          draggable={false}
        />
      ) : (
        <span style={{ color: '#999', fontSize: 13 }}>无图片</span>
      )}
    </div>
  )
}
