import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type WheelEvent } from 'react'
import { createGrove, type Grove, type GroveNode } from '../grove'
import { opensAs, type Entry, type Layout } from '../portfolio'
import { useAddress } from './address.ts'
import { CaseStudy, PAGE_IN } from './case/CaseStudy.tsx'
import { Contact } from './Contact.tsx'
import { labelArea } from './labels.ts'
import { Masthead } from './Masthead.tsx'
import { Nodes } from './Nodes.tsx'
import { Preview } from './Preview.tsx'
import { useDrag } from './useDrag.ts'
import { useViewport, type Viewport } from './useViewport.ts'

// three.js is ~1 MB; the page paints first and the plant grows once it arrives.
const Scene = lazy(() => import('../scene/Scene.tsx'))

/** The portfolio: a file tree drawn as a dithered plant, growing in from the left. */
export default function Garden() {
  const viewport = useViewport()
  // Each layout grows a plant of its own; crossing from one to the other starts afresh at the same address.
  return <Plot key={viewport.narrow ? 'phone' : 'desktop'} layout={viewport.layout} viewport={viewport} />
}

function Plot({ layout, viewport }: { layout: Layout; viewport: Viewport }) {
  const { width, height, scale, dpr } = viewport
  const [grove] = useState(() =>
    createGrove(layout.tree, {
      still: matchMedia('(prefers-reduced-motion: reduce)').matches,
      view: [width / scale, height / scale],
      ground: layout.ground,
      fitWidth: layout.fitWidth,
      headroom: layout.headroom,
      exclusive: layout.exclusive,
    }),
  )
  useSyncExternalStore(grove.subscribe, () => grove.version)
  useAddress(grove)
  const { masthead } = layout
  const [keepOut] = useState(() => [...grove.layout.nodes.map((node) => labelArea(node)), masthead.intro.box, masthead.time.box])
  const view = useMemo(() => ({ width, height, scale, dpr }), [width, height, scale, dpr])
  const drag = useDrag(grove, scale)
  const [contact, setContact] = useState(false)
  const covered = useCovered(grove)
  useEffect(() => grove.setView(width / scale, height / scale), [grove, width, height, scale])

  const scroll = (event: WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey) return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1
    grove.pan((event.deltaX * unit) / scale, (event.deltaY * unit) / scale)
  }

  const open = (node: GroveNode<Entry>) => {
    if (node.data?.kind === 'link') window.open(node.data.href, '_blank', 'noopener')
    else if (grove.location === node.id) grove.close(node.id)
    else grove.open(node.id)
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
        <Masthead grove={grove} view={view} masthead={masthead} onContact={() => setContact(true)} />
        <div className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <Scene grove={grove} keepOut={keepOut} scale={scale} dpr={dpr} paused={covered} />
          </Suspense>
        </div>
        <Nodes grove={grove} view={view} onOpen={open} />
      </div>
      <Contact open={contact} onToggle={setContact} pixel={viewport.pixel} />
      <Opened grove={grove} width={width} height={height} narrow={viewport.narrow} />
    </>
  )
}

/** True once a case study has finished growing in over the plant, until it closes: nothing behind it needs drawing. */
function useCovered(grove: Grove<Entry>) {
  const nodes = useMemo(() => new Map(grove.layout.nodes.map((node) => [node.id, node])), [grove])
  const reading = opensAs(nodes.get(grove.location)?.data) === 'page'
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!reading) return
    const timer = setTimeout(() => setSettled(true), PAGE_IN)
    return () => {
      clearTimeout(timer)
      setSettled(false)
    }
  }, [reading])
  return reading && settled
}

/** Whatever file is open: a preview over the plant, or a case study over everything. */
function Opened({ grove, width, height, narrow }: { grove: Grove<Entry>; width: number; height: number; narrow: boolean }) {
  const nodes = useMemo(() => new Map(grove.layout.nodes.map((node) => [node.id, node])), [grove])
  const here = nodes.get(grove.location)
  const how = here?.kind === 'file' ? opensAs(here.data) : 'none'

  // A preview stays mounted while it shrinks back into its file.
  const [shown, setShown] = useState<GroveNode<Entry> | null>(null)
  const previewing = how === 'preview' ? here! : null
  if (previewing && previewing !== shown) setShown(previewing)
  const gone = useCallback(() => setShown(null), [])

  const cases = useMemo(() => grove.layout.nodes.filter((node) => node.data?.kind === 'case'), [grove])

  return (
    <>
      {shown && (
        <Preview
          key={shown.id}
          node={shown}
          width={width}
          height={height}
          narrow={narrow}
          leaving={shown !== previewing}
          onClose={() => grove.close(shown.id)}
          onGone={gone}
        />
      )}
      {how === 'page' && here?.data?.kind === 'case' && (
        <CaseStudy
          path={here.id}
          kicker={folderNote(nodes.get(here.parent))}
          body={here.data.body}
          next={nextCase(grove, cases, here)}
          onClose={() => grove.close(here.id)}
        />
      )}
    </>
  )
}

function folderNote(folder: GroveNode<Entry> | undefined) {
  return folder?.data?.kind === 'folder' ? folder.data.note : undefined
}

function nextCase(grove: Grove<Entry>, cases: GroveNode<Entry>[], here: GroveNode<Entry>) {
  const next = cases[(cases.indexOf(here) + 1) % cases.length]
  const name = next.parent.split('/').pop()!
  return { label: name, go: () => grove.go(next.id) }
}
