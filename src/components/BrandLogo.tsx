import logoUrl from '../assets/logo.png'

type BrandLogoProps = {
  size?: number
  className?: string
  /** Show「微思文稿」text beside the mark */
  withText?: boolean
  alt?: string
}

/** Bar-chart brand mark from vslide-vue/public/logo.png. */
export function BrandLogo({
  size = 24,
  className,
  withText = false,
  alt = '微思文稿',
}: BrandLogoProps) {
  return (
    <span className={'brand-logo' + (className ? ` ${className}` : '')}>
      <img
        src={logoUrl}
        width={size}
        height={size}
        alt={alt}
        draggable={false}
      />
      {withText ? <strong className="brand-logo-text">微思文稿</strong> : null}
    </span>
  )
}
