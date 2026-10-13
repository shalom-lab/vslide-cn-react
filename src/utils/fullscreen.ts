/** Best-effort browser Fullscreen API helpers for play mode. */

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FsDoc = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
  msExitFullscreen?: () => Promise<void> | void
  msFullscreenElement?: Element | null
}

export function requestAppFullscreen(el?: HTMLElement | null): void {
  const target = (el ?? document.documentElement) as FsEl
  const req =
    target.requestFullscreen?.bind(target) ??
    target.webkitRequestFullscreen?.bind(target) ??
    target.msRequestFullscreen?.bind(target)
  if (!req) return
  try {
    void Promise.resolve(req()).catch(() => {
      /* autoplay-policy / unsupported — ignore */
    })
  } catch {
    /* ignore */
  }
}

export function exitAppFullscreen(): void {
  const doc = document as FsDoc
  const active =
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.msFullscreenElement
  if (!active) return
  const exit =
    doc.exitFullscreen?.bind(doc) ??
    doc.webkitExitFullscreen?.bind(doc) ??
    doc.msExitFullscreen?.bind(doc)
  if (!exit) return
  try {
    void Promise.resolve(exit()).catch(() => {
      /* ignore */
    })
  } catch {
    /* ignore */
  }
}
