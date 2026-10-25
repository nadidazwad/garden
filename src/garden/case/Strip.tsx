import { useEffect, useRef } from 'react'
import type { Media } from './parse.ts'
import { ratio } from './media.ts'
import { Tile } from './Tile.tsx'

// Where each row starts along its length, and which way it drifts first.
const STARTS = [
  { from: 0.18, way: 1 },
  { from: 0.72, way: -1 },
  { from: 0.35, way: 1 },
]

/** Rows of tiles that run the full width of the page, drifting sideways until you point at them. */
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

  useEffect(() => {
    const el = strip.current
    if (!el) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const { from, way } = STARTS[index] ?? { from: 0.3, way: index % 2 ? -1 : 1 }
    const speed = 16 * (1 + 0.15 * index)
    let at = 0
    let dir = way
    let pointed = false
    let seen = false
    let placed = false
    let last = 0
    let frame = 0
    // Mice drag the row; touch scrolls it natively. A drag past 8px swallows the click.
    let held = false
    let pointer = 0
    let startX = 0
    let startLeft = 0
    let moved = 0

    const place = () => {
      const end = el.scrollWidth - el.clientWidth
      if (placed || end <= 1) return
      placed = true
      el.scrollLeft = at = from * end
    }
    const drift = (now: number) => {
      frame = requestAnimationFrame(drift)
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      const end = el.scrollWidth - el.clientWidth
      if (end <= 1 || pointed || held || !seen || reduced.matches) return
      if (Math.abs(el.scrollLeft - at) > 1) at = el.scrollLeft
      at += dir * speed * dt
      if (at >= end) [at, dir] = [end, -1]
      if (at <= 0) [at, dir] = [0, 1]
      el.scrollLeft = at
    }
    place()
    frame = requestAnimationFrame(drift)
    const view = new IntersectionObserver(([entry]) => (seen = entry.isIntersecting))
    view.observe(el)
    const size = new ResizeObserver(place)
    size.observe(el)

    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      held = true
      moved = 0
      startX = event.clientX
      startLeft = el.scrollLeft
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
      el.scrollLeft = at = startLeft - dx
      event.preventDefault()
    }
    const up = () => {
      if (!held) return
      held = false
      if (pointer) el.releasePointerCapture(pointer)
      pointer = 0
      delete el.dataset.held
      if (moved > 8) {
        const swallow = (event: MouseEvent) => {
          event.stopPropagation()
          event.preventDefault()
        }
        el.addEventListener('click', swallow, { capture: true, once: true })
        setTimeout(() => el.removeEventListener('click', swallow, true), 0)
      }
    }
    const enter = () => (pointed = true)
    const leave = () => (pointed = false)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      cancelAnimationFrame(frame)
      view.disconnect()
      size.disconnect()
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [index])

  return (
    <div
      ref={strip}
      role="group"
      aria-label={`Row ${index + 1} of ${of}`}
      className="mx-[calc(50%-50vw)] -my-26 flex h-[calc(var(--th)+52px)] cursor-grab items-center gap-15 overflow-x-auto overscroll-x-contain px-[max(24px,50vw-399px)] select-none [--th:min(235.5px,42vw)] [scrollbar-width:none] data-held:cursor-grabbing [&::-webkit-scrollbar]:hidden"
    >
      {row.map((media) => (
        <button
          key={media.src}
          type="button"
          aria-label={media.alt}
          onClick={() => open(media)}
          className="relative h-(--th) flex-none cursor-[inherit] overflow-hidden rounded-[20px] bg-well p-0 outline-none transition-[transform,box-shadow] duration-240 ease-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent [@media(hover:hover)]:hover:-translate-y-5 [@media(hover:hover)]:hover:shadow-[0_10px_24px_-8px_#0000004d]"
          style={{ width: `calc(var(--th) * ${ratio(media)})` }}
        >
          <Tile media={media} className="pointer-events-none" />
        </button>
      ))}
    </div>
  )
}
