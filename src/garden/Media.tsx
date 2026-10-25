import { useState, type CSSProperties } from 'react'
import { PixelIcon, type GlyphName } from '../icons'
import { filmUrl, posterUrl, stillUrl } from '../portfolio'

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
      className={`block bg-well object-cover ${className}`}
      style={style}
    />
  )
}

/** A silent screen recording that loops like a moving still; with reduced motion it waits on its poster. */
export function Loop({ path, label, className = '', style }: { path: string; label: string; className?: string; style?: CSSProperties }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <Placeholder glyph="film" label={label} className={className} style={style} />
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <video
      src={filmUrl(path)}
      poster={posterUrl(path)}
      aria-label={label}
      onError={() => setMissing(true)}
      autoPlay={!still}
      controls={still}
      muted
      loop
      playsInline
      preload="metadata"
      className={`block bg-well object-cover ${className}`}
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
