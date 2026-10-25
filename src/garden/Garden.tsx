import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type WheelEvent } from 'react'
import { createGrove, type Grove, type GroveNode } from '../grove'
import { GROUND, INTRO, opensAs, portfolio, TIME, type Entry } from '../portfolio'
import { CaseStudy } from './case/CaseStudy.tsx'
import { Contact } from './Contact.tsx'
import { labelArea } from './labels.ts'
import { Masthead } from './Masthead.tsx'
import { Nodes } from './Nodes.tsx'
import { Preview } from './Preview.tsx'
import { useDrag } from './useDrag.ts'
import { useLocationSync } from './useLocationSync.ts'
import { useViewport } from './useViewport.ts'

// three.js is ~1 MB; the page paints first and the plant grows once it arrives.
const Scene = lazy(() => import('../scene/Scene.tsx'))

/** The portfolio: a file tree drawn as a dithered plant, growing in from the left. */
export default function Garden() {
  const [grove] = useState(() =>
    createGrove(portfolio, { still: matchMedia('(prefers-reduced-motion: reduce)').matches, ground: GROUND }),
  )
  useSyncExternalStore(grove.subscribe, () => grove.version)
  useLocationSync(grove)
  const [keepOut] = useState(() => [...grove.layout.nodes.map((node) => labelArea(node)), INTRO, TIME])
  const viewport = useViewport()
  const { width, height, scale, dpr } = viewport
  const view = useMemo(() => ({ width, height, scale, dpr }), [width, height, scale, dpr])
  const drag = useDrag(grove, scale)
  const [contact, setContact] = useState(false)
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
        <Masthead grove={grove} view={view} onContact={() => setContact(true)} />
        <div className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <Scene grove={grove} keepOut={keepOut} scale={scale} dpr={dpr} />
          </Suspense>
        </div>
        <Nodes grove={grove} view={view} onOpen={open} />
      </div>
      <Contact open={contact} onToggle={setContact} pixel={viewport.pixel} />
      <Opened grove={grove} width={width} height={height} />
    </>
  )
}

/** Whatever file is open: a preview over the plant, or a case study over everything. */
function Opened({ grove, width, height }: { grove: Grove<Entry>; width: number; height: number }) {
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
