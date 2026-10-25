import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { PixelIcon } from '../../icons'
import { sound } from '../../sound'
import type { Pair } from './parse.ts'
import { ratio } from './media.ts'
import { Tile } from './Tile.tsx'

const LABEL =
  'pointer-events-none absolute top-8 rounded-full bg-ink-veil px-7 py-4 text-[9px] leading-none tracking-[0.1em] text-white uppercase backdrop-blur-[6px] transition-opacity duration-200 sm:top-12 sm:px-10 sm:py-5 sm:text-[11px] sm:tracking-[0.14em]'

const NUDGE = 'transition-[clip-path,left] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]'

/**
 * Before and after, one over the other: drag anywhere to wipe between them. The
 * first time it comes into view it nudges, to show it moves. Tabs switch pairs.
 */
export function Compare({ pairs }: { pairs: Pair[] }) {
  const frame = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState(0)
  const [pos, setPos] = useState(50)
  const [nudging, setNudging] = useState(false)
  const [full, setFull] = useState(false)
  const dragging = useRef(false)
  const pair = pairs[tab]
  const [canFull] = useState(() => document.fullscreenEnabled)

  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  // Moved by hand, the divider ticks past every tenth, heard from where it is.
  const tenth = useRef(5)
  const moveTo = (next: number) => {
    const at = clamp(next)
    const band = Math.round(at / 10)
    if (band !== tenth.current) {
      tenth.current = band
      sound.play('detent', { pan: (at / 50 - 1) * 0.6 })
    }
    setPos(at)
  }
  const seek = (clientX: number) => {
    const box = frame.current?.getBoundingClientRect()
    if (box) moveTo(((clientX - box.left) / box.width) * 100)
  }

  useEffect(() => {
    const el = frame.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timers: number[] = []
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        watch.disconnect()
        setNudging(true)
        timers.push(window.setTimeout(() => setPos(62), 400))
        timers.push(window.setTimeout(() => setPos(50), 1150))
        timers.push(window.setTimeout(() => setNudging(false), 1900))
      },
      { threshold: 0.6 },
    )
    watch.observe(el)
    return () => {
      watch.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    const change = () => setFull(document.fullscreenElement === frame.current)
    document.addEventListener('fullscreenchange', change)
    return () => document.removeEventListener('fullscreenchange', change)
  }, [])

  if (!pair) return null
  const press = (event: ReactPointerEvent) => {
    if ((event.target as HTMLElement).closest('[data-fullscreen]')) return
    dragging.current = true
    setNudging(false)
    frame.current?.setPointerCapture(event.pointerId)
    seek(event.clientX)
  }
  const motion = nudging ? NUDGE : ''

  return (
    <div>
      <div
        ref={frame}
        onPointerDown={press}
        onPointerMove={(event) => dragging.current && seek(event.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="group/compare relative cursor-ew-resize touch-pan-y overflow-hidden rounded-[18px] border border-line bg-white select-none [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-black"
        style={{ aspectRatio: full ? undefined : ratio(pair.after) }}
      >
        <div className="pointer-events-none absolute inset-0">
          <Tile key={pair.after.src} media={pair.after} eager fit={full ? 'contain' : 'cover'} />
        </div>
        <div className={`pointer-events-none absolute inset-0 ${motion}`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Tile key={pair.before.src} media={pair.before} eager fit={full ? 'contain' : 'cover'} />
        </div>
        <span className={`${LABEL} left-8 sm:left-12`} style={{ opacity: pos < 15 ? 0 : 1 }}>
          {pair.before.alt}
        </span>
        <span className={`${LABEL} right-8 sm:right-12`} style={{ opacity: pos > 85 ? 0 : 1 }}>
          {pair.after.alt}
        </span>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 w-2 -translate-x-1 bg-white shadow-[0_0_0_1px_#00000014] ${motion}`}
          style={{ left: `${pos}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Reveal ${pair.before.alt.toLowerCase()} or ${pair.after.alt.toLowerCase()}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2
            const next = { ArrowLeft: pos - step, ArrowRight: pos + step, Home: 0, End: 100 }[event.key]
            if (next === undefined) return
            event.preventDefault()
            setNudging(false)
            moveTo(next)
          }}
          className={`absolute top-1/2 grid size-30 -translate-1/2 cursor-ew-resize place-items-center rounded-full border-[1.5px] border-white/55 bg-ink-veil text-white outline-none backdrop-blur-[6px] transition-transform duration-150 group-active/compare:scale-106 hover:scale-106 focus-visible:shadow-[0_0_0_3px_white,0_0_0_5px_#111214] sm:size-36 ${motion}`}
          style={{ left: `${pos}%` }}
        >
          <PixelIcon name="chevrons" pixel={2} />
        </div>
        {canFull && (
          <button
            type="button"
            data-fullscreen
            aria-label={full ? 'Leave full screen' : 'Full screen'}
            onClick={() => (full ? document.exitFullscreen() : frame.current?.requestFullscreen())}
            className="absolute right-8 bottom-8 grid size-28 cursor-pointer place-items-center rounded-full bg-ink-veil text-white outline-none transition-[scale] duration-150 ease-out hover:scale-106 active:scale-[0.92] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent sm:right-12 sm:bottom-12 sm:size-34"
          >
            <PixelIcon name="fullscreen" pixel={2} />
          </button>
        )}
      </div>
      {pairs.length > 1 && (
        <div role="tablist" aria-label="Screen" className="mt-10 flex flex-wrap gap-6 sm:mt-14">
          {pairs.map((each, i) => (
            <button
              key={each.tab}
              type="button"
              role="tab"
              aria-selected={i === tab}
              onClick={() => {
                if (i !== tab) sound.play('switch')
                setTab(i)
              }}
              className={`cursor-pointer rounded-full border px-11 py-6 text-[13px] leading-none outline-none transition-[color,background-color,border-color,scale] duration-150 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-14 sm:py-8 sm:text-[14px] ${
                i === tab ? 'border-ink bg-ink text-white' : 'border-line bg-white text-body hover:text-ink'
              }`}
            >
              {each.tab}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
