import { useEffect, useRef } from 'react'
import type { Media } from './parse.ts'
import { ratio } from './media.ts'
import { Tile } from './Tile.tsx'

// Where each row starts along its loop, and which way it drifts.
const STARTS = [
  { from: 0.18, way: 1 },
  { from: 0.72, way: -1 },
  { from: 0.35, way: 1 },
]

/** How long speed changes take to settle (pausing, resuming, a throw dying out), in seconds. */
const SETTLE = 0.45

/** Rows of tiles that run the full width of the page, drifting sideways in a loop until you point at them. */
export function Strip({ rows, open }: { rows: Media[][]; open: (media: Media) => void }) {
  return (
    <div className="mt-66 mb-26 flex flex-col gap-18">
      {rows.map((row, i) => (
        <Row key={i} row={row} index={i} of={rows.length} open={open} />
      ))}
    </div>
  )
}

function Row({ row, index, of, open }: { row: Media[]; index: number; of: number; open: (media: Media) => void }) {
  const strip = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = strip.current
    const belt = track.current
    if (!el || !belt) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const { from, way } = STARTS[index] ?? { from: 0.3, way: index % 2 ? -1 : 1 }
    const cruise = way * 16 * (1 + 0.15 * index)
    // The row is laid out three times and the middle copy sits in view, `at` past its start.
    // A transform rather than scrollLeft, which rounds to whole pixels and at this speed steps every few frames.
    let period = 0
    let at = 0
    let speed = 0
    let pointed = false
    let focused = false
    let frame = 0
    let last = 0
    // Mice and fingers drag the row; letting go mid-swipe throws it, and the throw eases back into the drift.
    let held = false
    let pointer = 0
    let startX = 0
    let startAt = 0
    let moved = 0
    let trail: { x: number; t: number }[] = []

    /** Within half a copy either way, where the copies on both sides still fill any screen under 1.5 copies wide. */
    const wrap = (x: number) => (period ? x - period * Math.round(x / period) : 0)
    const paint = () => {
      // At rest, land on a device pixel so the stills stay sharp.
      const x = Math.abs(speed) < 0.5 && !held ? Math.round((period + at) * devicePixelRatio) / devicePixelRatio : period + at
      belt.style.transform = `translate3d(${-x}px,0,0)`
    }
    const measure = () => {
      const first = belt.children[0] as HTMLElement | undefined
      const second = belt.children[row.length] as HTMLElement | undefined
      const next = first && second ? second.offsetLeft - first.offsetLeft : 0
      if (next <= 0) return
      at = wrap(period ? at * (next / period) : from * next)
      period = next
      paint()
    }
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      if (held || !period) return
      const target = pointed || focused || reduced.matches ? 0 : cruise
      speed += (target - speed) * (1 - Math.exp(-dt / SETTLE))
      if (target === 0 && Math.abs(speed) < 0.01) speed = 0
      // Left unwrapped while a tile has keyboard focus, so the focused tile doesn't jump a copy away.
      at = focused ? at + speed * dt : wrap(at + speed * dt)
      paint()
    }
    const run = () => {
      if (frame) return
      last = 0
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    /** Brings a tile that's been tabbed to into view. */
    const reveal = (tile: HTMLElement) => {
      el.scrollLeft = 0
      const box = el.getBoundingClientRect()
      const rect = tile.getBoundingClientRect()
      if (rect.left >= box.left + 24 && rect.right <= box.right - 24) return
      speed = 0
      at += rect.left + rect.width / 2 - (box.left + box.width / 2)
      paint()
    }

    measure()
    const view = new IntersectionObserver(([entry]) => (entry.isIntersecting ? run() : stop()))
    view.observe(el)
    const size = new ResizeObserver(measure)
    size.observe(belt)

    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      held = true
      moved = 0
      startX = event.clientX
      startAt = at
      trail = [{ x: event.clientX, t: event.timeStamp }]
      el.dataset.held = ''
    }
    const move = (event: PointerEvent) => {
      if (!held) return
      const dx = event.clientX - startX
      moved = Math.max(moved, Math.abs(dx))
      if (moved <= 8) return
      if (!pointer) {
        pointer = event.pointerId
        el.setPointerCapture(pointer)
      }
      at = wrap(startAt - dx)
      trail.push({ x: event.clientX, t: event.timeStamp })
      trail = trail.filter((point) => event.timeStamp - point.t < 100)
      paint()
      event.preventDefault()
    }
    const up = (event: PointerEvent) => {
      if (!held) return
      held = false
      if (pointer) el.releasePointerCapture(pointer)
      pointer = 0
      delete el.dataset.held
      // A cancel means the page took the gesture (a vertical scroll): no throw, no click to swallow.
      if (moved <= 8 || event.type === 'pointercancel') return
      const first = trail[0]
      const span = (event.timeStamp - first.t) / 1000
      speed = span > 0.01 ? Math.max(-3000, Math.min(3000, (first.x - event.clientX) / span)) : 0
      const swallow = (click: MouseEvent) => {
        click.stopPropagation()
        click.preventDefault()
      }
      el.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => el.removeEventListener('click', swallow, true), 0)
    }
    // Trackpads swipe the row sideways; vertical wheels still scroll the page.
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      at = wrap(at + event.deltaX)
      paint()
    }
    // The browser scrolls the clipped row to show a focused tile; the belt does that instead.
    const scrolled = () => {
      if (!el.scrollLeft) return
      el.scrollLeft = 0
      if (document.activeElement instanceof HTMLElement && el.contains(document.activeElement)) reveal(document.activeElement)
    }
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') pointed = true
    }
    const leave = () => (pointed = false)
    const focusIn = (event: FocusEvent) => {
      const tile = event.target as HTMLElement
      focused = tile.matches(':focus-visible')
      if (focused) reveal(tile)
    }
    const focusOut = () => (focused = false)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('scroll', scrolled)
    el.addEventListener('focusin', focusIn)
    el.addEventListener('focusout', focusOut)
    return () => {
      stop()
      view.disconnect()
      size.disconnect()
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('scroll', scrolled)
      el.removeEventListener('focusin', focusIn)
      el.removeEventListener('focusout', focusOut)
    }
  }, [index, row.length])

  return (
    <div
      ref={strip}
      role="group"
      aria-label={`Row ${index + 1} of ${of}`}
      className="mx-[calc(50%-50vw)] -my-26 flex h-[calc(var(--th)+52px)] cursor-grab touch-pan-y items-center overflow-hidden select-none [--th:min(235.5px,42vw)] data-held:cursor-grabbing"
    >
      <div ref={track} className="flex w-max gap-15 will-change-transform">
        {[0, 1, 2].map((copy) =>
          row.map((media) => {
            // The outer copies only close the loop: one set of buttons for keyboards and screen readers.
            const echo = copy !== 1
            return (
              <button
                key={`${copy}:${media.src}`}
                type="button"
                aria-label={media.alt}
                aria-hidden={echo || undefined}
                tabIndex={echo ? -1 : undefined}
                onMouseDown={echo ? (event) => event.preventDefault() : undefined}
                onClick={() => open(media)}
                className="relative h-(--th) flex-none cursor-[inherit] overflow-hidden rounded-[20px] border border-[#d2d2d2] bg-well p-0 outline-none transition-[transform,box-shadow] duration-240 ease-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent [@media(hover:hover)]:hover:-translate-y-5 [@media(hover:hover)]:hover:shadow-[0_10px_24px_-8px_#0000004d]"
                style={{ width: `calc(var(--th) * ${ratio(media)})` }}
              >
                <Tile media={media} className="pointer-events-none" />
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
