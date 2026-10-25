import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { PixelIcon } from '../../icons'
import { filmUrl, posterUrl, stillUrl } from '../../portfolio'
import { sound } from '../../sound'
import { Placeholder } from '../Media.tsx'
import { playWithSound } from '../film.ts'
import { Cross } from './Bar.tsx'
import type { Media } from './parse.ts'
import { isFilm, ratio } from './media.ts'

const SLIDE = 280
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

interface Props {
  items: Media[]
  index: number
  onIndex: (index: number) => void
  onClose: () => void
}

/**
 * Every deliverable and strip tile, full size on ink, one at a time. Arrows or a
 * sideways swipe move through them; Esc or a swipe down puts the page back.
 */
export function Viewer({ items, index, onIndex, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const chrome = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const [view, setView] = useState({ w: innerWidth, h: innerHeight })
  const count = items.length
  const wrap = (i: number) => ((i % count) + count) % count

  const slide = (dx: number, dy = 0, ms = 0) => {
    const el = track.current
    if (!el) return
    const away = Math.min(1, Math.abs(dy) / (0.9 * view.h))
    el.style.transition = ms ? `transform ${ms}ms ${EASE}` : 'none'
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${1 - 0.55 * away})`
    if (chrome.current) {
      chrome.current.style.transition = ms ? `opacity ${ms}ms ${EASE}` : 'none'
      chrome.current.style.opacity = String(1 - 0.85 * away)
    }
  }
  const go = (step: 1 | -1, ms = SLIDE) => {
    if (count < 2 || busy.current) return
    busy.current = true
    // The swish leans the way the pieces move.
    sound.play('step', { pan: step * 0.35 })
    slide(-step * view.w, 0, ms)
    window.setTimeout(() => onIndex(wrap(index + step)), ms)
  }

  // Opening, the dark comes up and the piece settles in out of it.
  useLayoutEffect(() => {
    sound.play('peek')
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    root.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' })
    track.current?.animate([{ transform: 'scale(0.96)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
  }, [])

  // Closing fades it all out from wherever it is, a swipe down included, then hands back.
  const leaving = useRef(false)
  const leave = () => {
    const el = root.current
    if (leaving.current) return
    leaving.current = true
    sound.play('unpeek')
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return onClose()
    el.style.pointerEvents = 'none'
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.then(onClose, onClose)
  }

  // A new piece lands in the middle; the track snaps back under it without moving.
  useLayoutEffect(() => {
    for (const el of [track.current, chrome.current]) el?.style.removeProperty('transition')
    track.current?.style.removeProperty('transform')
    chrome.current?.style.removeProperty('opacity')
    busy.current = false
  }, [index])

  useEffect(() => {
    root.current?.focus()
    const resize = () => setView({ w: innerWidth, h: innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leave()
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  // A drag picks its axis after 6px: sideways moves through the set, down dismisses.
  const drag = useRef<{ id: number; x: number; y: number; axis?: 'x' | 'y'; dx: number; dy: number; t: number } | null>(null)
  const down = (event: PointerEvent) => {
    if (busy.current || event.button > 0 || (event.target as HTMLElement).closest('button, video[controls]')) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0, t: performance.now() }
  }
  const move = (event: PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    d.dx = event.clientX - d.x
    d.dy = event.clientY - d.y
    if (!d.axis) {
      if (Math.abs(d.dx) < 6 && Math.abs(d.dy) < 6) return
      d.axis = Math.abs(d.dx) > Math.abs(d.dy) ? 'x' : 'y'
      if (d.axis === 'x' && count < 2) return void (drag.current = null)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (d.axis === 'x') slide(d.dx)
    else slide(d.dx, d.dy)
  }
  const up = (event: PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    drag.current = null
    const fast = (distance: number) => Math.abs(distance) / Math.max(1, performance.now() - d.t) > 0.45
    if (d.axis === 'y') {
      if (Math.abs(d.dy) > 0.25 * view.h || (fast(d.dy) && Math.abs(d.dy) > 64)) leave()
      else slide(0, 0, 360)
    } else if (d.axis === 'x') {
      const ms = Math.max(120, SLIDE * (1 - Math.abs(d.dx) / view.w))
      if (d.dx < -0.2 * view.w || (fast(d.dx) && d.dx < 0)) go(1, ms)
      else if (d.dx > 0.2 * view.w || (fast(d.dx) && d.dx > 0)) go(-1, ms)
      else slide(0, 0, 220)
    }
  }

  const box = fit(items[index], view)
  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={items[index].alt}
      tabIndex={-1}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="fixed inset-0 z-200 touch-none outline-none select-none"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink" />
      <div ref={track} className="pointer-events-none fixed inset-0">
        {([-1, 0, 1] as const).map((offset) => {
          if (count < 2 && offset) return null
          const media = items[wrap(index + offset)]
          const at = fit(media, view)
          return (
            <div
              key={`${offset}:${media.src}`}
              className={`fixed overflow-hidden rounded-[2px] shadow-[0_40px_120px_rgba(0,0,0,0.55)] ${offset ? '' : 'pointer-events-auto'}`}
              style={{ left: at.left + offset * view.w, top: at.top, width: at.width, height: at.height }}
            >
              <Shown media={media} live={offset === 0} />
            </div>
          )
        })}
      </div>
      <div ref={chrome}>
        <button
          type="button"
          aria-label="Close"
          onClick={leave}
          className="group absolute top-20 right-22 z-10 grid size-40 cursor-pointer place-items-center rounded-full bg-white/10 text-white/70 outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/20 hover:text-white focus-visible:bg-white/20 focus-visible:text-white active:scale-[0.92]"
        >
          <Cross size={20} />
        </button>
        {count > 1 &&
          ([-1, 1] as const).map((step) => (
            <button
              key={step}
              type="button"
              aria-label={step < 0 ? 'Previous' : 'Next'}
              onClick={() => go(step)}
              className={`absolute top-1/2 z-10 grid h-64 w-56 -translate-y-1/2 cursor-pointer place-items-center text-white/45 outline-none transition-[color,scale] duration-150 ease-out hover:text-white focus-visible:text-white active:scale-[0.9] max-sm:hidden ${
                step < 0 ? 'left-24' : 'right-24'
              }`}
            >
              <PixelIcon name={step < 0 ? 'arrowLeft' : 'arrowRight'} pixel={3} />
            </button>
          ))}
        <div className="pointer-events-none absolute inset-x-0 px-24 text-center" style={{ top: box.top + box.height + 18 }}>
          <p key={index} className="text-[13px] leading-[18px] text-white/80 motion-safe:animate-roll">
            {items[index].alt}
          </p>
          {count > 1 && (
            <p className="mt-4 text-[12px] leading-[17px] text-white/40 tabular-nums">
              {index + 1} of {count}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** The media at its own shape, as big as fits with room for the caption below. */
function fit(media: Media, view: { w: number; h: number }) {
  const narrow = view.w < 640
  const shape = ratio(media)
  const maxWidth = Math.min(1000, view.w - (narrow ? 32 : 160))
  const maxHeight = view.h - (narrow ? 220 : 160)
  const width = Math.min(maxWidth, maxHeight * shape)
  const height = width / shape
  return { width, height, left: (view.w - width) / 2, top: (view.h - height) / 2 - 16 }
}

function Shown({ media, live }: { media: Media; live: boolean }) {
  const [missing, setMissing] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const film = isFilm(media)
  // A film opened full size plays with its sound, as the preview's do; its controls can turn it down.
  useEffect(() => {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) playWithSound(video.current, () => {})
  }, [missing])
  if (missing) return <Placeholder glyph={film ? 'film' : 'picture'} label={media.alt} className="size-full" />
  if (film && live)
    return (
      <video
        ref={video}
        src={filmUrl(media.src)}
        poster={posterUrl(media.src)}
        aria-label={media.alt}
        loop
        playsInline
        controls
        onError={() => setMissing(true)}
        className="block size-full bg-black object-contain"
      />
    )
  return (
    <img
      src={film ? posterUrl(media.src) : stillUrl(media.src)}
      alt={live ? media.alt : ''}
      draggable={false}
      onError={() => setMissing(true)}
      className="block size-full object-contain"
    />
  )
}
