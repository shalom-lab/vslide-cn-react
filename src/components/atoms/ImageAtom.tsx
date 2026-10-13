import type { AtomContent } from '../../types/deck'

export function ImageAtom({ atomContent }: { atomContent: AtomContent }) {
  const src = String(atomContent.detail.src ?? '')
  // Vue single-image detail is { src } only — object-fit is CSS default contain
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
