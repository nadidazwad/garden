import { useState, type CSSProperties } from 'react'
import { PixelIcon, type GlyphName } from '../icons'
import { stillUrl } from '../portfolio'

interface StillProps {
  /** The still's path in the tree, or a case study's own media path. */
  path: string
  alt: string
  className?: string
  style?: CSSProperties
  lazy?: boolean
}

/** A still from the media store, or a placeholder until it's been uploaded. */
export function Still({ path, alt, className = '', style, lazy }: StillProps) {
  const [missing, setMissing] = useState(false)
  if (missing) return <Placeholder glyph="picture" label={alt} className={className} style={style} />
  return (
    <img
      src={stillUrl(path)}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      onError={() => setMissing(true)}
      // It develops in once it's arrived, rather than painting in strips.
      onLoad={(event) => (event.currentTarget.dataset.loaded = '')}
      className={`block bg-well object-cover motion-safe:opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:data-loaded:opacity-100 ${className}`}
      style={style}
    />
  )
}

/** Stands in for media that hasn't been uploaded yet, at the size the real thing will take. */
export function Placeholder({
  glyph,
  label,
  className = '',
  style,
}: {
  glyph: GlyphName
  label: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      role="img"
      aria-label={`${label} (coming soon)`}
      className={`flex flex-col items-center justify-center gap-12 bg-well text-faint ${className}`}
      style={style}
    >
      <PixelIcon name={glyph} pixel={5} />
      <span className="text-meta text-muted">
        {glyph === 'film' ? 'still rendering' : 'still in the camera roll'}
      </span>
    </div>
  )
}
