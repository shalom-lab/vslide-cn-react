/** Hand-drawn / sketch-style icons for toolbar & play chrome. */

type IconProps = {
  size?: number
  strokeWidth?: number
  className?: string
}

const base = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Rough “projector / play stage” mark — warmer than Lucide MonitorPlay. */
export function SketchPlay({ size = 20, strokeWidth = 1.7, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <rect
        x="2.5"
        y="4.5"
        width="19"
        height="12.5"
        rx="2"
        {...base}
        strokeWidth={strokeWidth}
      />
      {/* slightly wobbly play triangle */}
      <path
        d="M10.2 8.2v5.4c0 .35.38.56.68.38l4.3-2.7a.45.45 0 0 0 0-.76l-4.3-2.7a.45.45 0 0 0-.68.38z"
        fill="currentColor"
        stroke="none"
        opacity={0.92}
      />
      <path
        d="M7 19.5h10"
        {...base}
        strokeWidth={strokeWidth}
      />
      <path
        d="M9.5 17v2.5M14.5 17v2.5"
        {...base}
        strokeWidth={strokeWidth * 0.9}
      />
    </svg>
  )
}

/** Soft pencil — sketch edit affordance. */
export function SketchPencil({ size = 20, strokeWidth = 1.7, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        d="M13.5 5.2 18.8 10.4 9.2 20H4v-5.1L13.5 5.2z"
        {...base}
        strokeWidth={strokeWidth}
      />
      <path
        d="M12.2 6.6 17.3 11.6"
        {...base}
        strokeWidth={strokeWidth * 0.85}
      />
      <path
        d="M4.4 19.2c1.6-.2 2.8-1 3.6-2.2"
        {...base}
        strokeWidth={strokeWidth * 0.8}
        opacity={0.7}
      />
    </svg>
  )
}
