import { useEffect, useRef, useState } from 'react'
import { filmUrl, posterUrl, stillUrl } from '../../portfolio'
import { Placeholder } from '../Media.tsx'
import { isFilm } from './media.ts'
import type { Media } from './parse.ts'

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A still or a film filling its frame. Films sit on their poster and fade into
 * the moving picture once it plays, which they only do while on screen.
 */
export function Tile({ media, className = '', eager, fit = 'cover' }: { media: Media; className?: string; eager?: boolean; fit?: 'cover' | 'contain' }) {
  const [missing, setMissing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const film = isFilm(media)
  const fill = fit === 'contain' ? 'object-contain' : 'object-cover'

  useEffect(() => {
    const el = video.current
    if (!el || still()) return
    const watch = new IntersectionObserver(([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()), {
      rootMargin: '0px 200px',
    })
    watch.observe(el)
    return () => watch.disconnect()
  }, [missing])

  if (missing) return <Placeholder glyph={film ? 'film' : 'picture'} label={media.alt} className={`size-full ${className}`} />
  if (!film)
    return (
      <img
        src={stillUrl(media.src)}
        alt={media.alt}
        loading={eager ? undefined : 'lazy'}
        draggable={false}
        onError={() => setMissing(true)}
        onLoad={(event) => (event.currentTarget.dataset.loaded = '')}
        className={`block size-full bg-well ${fill} motion-safe:opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:data-loaded:opacity-100 ${className}`}
      />
    )
  return (
    <div className={`relative size-full bg-well ${className}`}>
      <img
        src={posterUrl(media.src)}
        alt=""
        aria-hidden
        draggable={false}
        onError={(event) => (event.currentTarget.style.visibility = 'hidden')}
        className={`block size-full rounded-[inherit] ${fill} transition-opacity duration-220 ease-out`}
        style={{ opacity: playing ? 0 : 1 }}
      />
      <video
        ref={video}
        src={filmUrl(media.src)}
        aria-label={media.alt}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onError={() => setMissing(true)}
        className={`absolute inset-0 size-full rounded-[inherit] ${fill} transition-opacity duration-220 ease-out`}
        style={{ opacity: playing ? 1 : 0 }}
      />
    </div>
  )
}
