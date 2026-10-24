import { lazy, Suspense, useEffect, useState, useSyncExternalStore, type CSSProperties, type WheelEvent } from 'react'
import { createGrove, documents, type Grove } from '../grove'
import { Nodes } from './Nodes.tsx'
import { useDrag } from './useDrag.ts'
import { useViewport } from './useViewport.ts'

// three.js is ~1 MB; the page paints first and the plant grows once it arrives.
const Scene = lazy(() => import('../scene/Scene.tsx'))

/** The portfolio: a file tree drawn as a dithered plant, growing in from the left. */
export default function Garden() {
  const [grove] = useState(() =>
    createGrove(documents, { still: matchMedia('(prefers-reduced-motion: reduce)').matches }),
  )
  useSyncExternalStore(grove.subscribe, () => grove.version)
  const viewport = useViewport()
  const { width, height, scale, dpr } = viewport
  const drag = useDrag(grove, scale)
  useEffect(() => grove.setView(width / scale, height / scale), [grove, width, height, scale])

  const scroll = (event: WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey) return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1
    grove.pan((event.deltaX * unit) / scale, (event.deltaY * unit) / scale)
  }

  return (
    <>
      <div
        className="fixed inset-0 touch-none overflow-hidden select-none data-dragging:cursor-grabbing data-pannable:cursor-grab"
        data-pannable={grove.canPan ? '' : undefined}
        style={{ '--spacing': `${scale}px`, '--px': `${viewport.pixel}px` } as CSSProperties}
        {...drag}
        onWheel={scroll}
      >
        <div className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <Scene grove={grove} scale={scale} dpr={dpr} />
          </Suspense>
        </div>
        <Nodes grove={grove} scale={scale} dpr={dpr} width={width} height={height} />
      </div>
      <Masthead />
      <Footer grove={grove} />
    </>
  )
}

function Masthead() {
  return (
    <header className="pointer-events-none fixed left-[38px] top-[34px]">
      <h1 className="font-mondwest text-headline text-ink">Azwad</h1>
      <p className="mt-[12px] text-copy-tight text-body">
        A portfolio, <span className="text-ink">grown from a file tree</span>.
        <br />
        Open a folder to see what’s inside.
      </p>
    </header>
  )
}

function Footer({ grove }: { grove: Grove }) {
  return (
    <footer className="pointer-events-none fixed inset-x-[38px] bottom-[30px] flex justify-between text-meta text-muted">
      <span
        aria-hidden={!grove.canPan}
        className={`transition-opacity duration-500 ease-out ${grove.canPan ? 'opacity-100' : 'opacity-0'}`}
      >
        drag to look around
      </span>
      <span>{grove.count === 1 ? '1 item' : `${grove.count} items`}</span>
    </footer>
  )
}
