import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode, type RefObject, type WheelEvent } from 'react'
import { labelArea } from '../garden/labels.ts'
import { CELL, createGrove, type Bounds, type FolderSpec, type GroveBranch, type GroveNode, type Vec2 } from '../grove'
import { glyphs, type GlyphName } from '../icons'
import { pathsOf, phone, place, portfolio, type Entry, type Placements } from '../portfolio'
import saved from '../portfolio/phone.json'
import { HELLO, problemsOnPhone } from './crowding.ts'

// Dev only: the phone layout, drawn as lines, for placing it by hand. Folders
// open one sibling at a time, as on the phone, so only what can be on screen
// together is drawn. Saving writes phone.json through the dev server.

const COLUMN = phone.frame.width
/** The shortest view the layout is drawn for, and a tall phone's. */
const SHORT = phone.frame.height
const TALL = 920
const SIDES = ['right', 'below', 'left'] as const
const HUES = ['#6b4a33', '#007bb9', '#d19a3d', '#36c21c', '#4fa3e0', '#8f9a22']
const DEVICES = [
  { label: 'iPhone SE, Safari', width: 375, height: 553 },
  { label: 'iPhone 12, Safari', width: 390, height: 664 },
  { label: 'iPhone 12, full', width: 390, height: 844 },
  { label: 'Pro Max, full', width: 430, height: 932 },
]
const STORE = 'phone-editor'

type Grab =
  | { kind: 'node'; path: string; subtree: boolean; label: boolean }
  | { kind: 'point'; path: string; index: number }
  | { kind: 'limb'; path: string; limb: number; index: number }
  | { kind: 'pan' }

interface Drag {
  grab: Grab
  start: Vec2
  client: Vec2
  before: Placements
  view: View
  moved: boolean
}

interface View {
  x: number
  y: number
  zoom: number
}

export default function PhoneEditor() {
  const stored = useMemo(() => JSON.parse(sessionStorage.getItem(STORE) ?? '{}') as { here?: string; view?: View; device?: number }, [])
  const [geometry, setGeometry] = useState(() => complete(saved as unknown as Placements))
  const [history, setHistory] = useState<{ past: Placements[]; future: Placements[] }>({ past: [], future: [] })
  const [savedText, setSavedText] = useState(() => format(complete(saved as unknown as Placements)))
  const [here, setHere] = useState(stored.here ?? '/')
  const [view, setView] = useState<View>(() => stored.view ?? startingView())
  const [device, setDevice] = useState(stored.device ?? 1)
  const [reloads, setReloads] = useState(0)
  const [status, setStatus] = useState('')
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)
  const size = useSize(svg)

  useEffect(() => sessionStorage.setItem(STORE, JSON.stringify({ here, view, device })), [here, view, device])

  const layout = useMemo(() => createGrove(place(portfolio, geometry)).layout, [geometry])
  const chain = useMemo(() => {
    const ids = ['/']
    const parts = here.split('/').filter(Boolean)
    parts.forEach((_, i) => ids.push(`/${parts.slice(0, i + 1).join('/')}`))
    return ids.filter((id) => id === '/' || layout.branches.has(id))
  }, [here, layout])
  const branches = chain.map((id) => layout.branches.get(id)!)
  const nodes = layout.nodes.filter((node) => chain.includes(node.parent))
  const problems = problemsOnPhone(nodes, branches)
  const flagged = new Set(problems.flatMap((problem) => problem.ids))
  const text = format(geometry)
  const dirty = text !== savedText
  const orphans = Object.keys(saved).filter((path) => !pathsOf(portfolio).includes(path))
  const unplaced = pathsOf(portfolio).filter((path) => !(path in saved))

  const commit = (next: Placements, before = geometry) => {
    setHistory(({ past }) => ({ past: [...past.slice(-200), before], future: [] }))
    setGeometry(next)
  }
  const undo = () => {
    const previous = history.past.at(-1)
    if (!previous) return
    setHistory(({ past, future }) => ({ past: past.slice(0, -1), future: [geometry, ...future] }))
    setGeometry(previous)
  }
  const redo = () => {
    const [next, ...rest] = history.future
    if (!next) return
    setHistory(({ past }) => ({ past: [...past, geometry], future: rest }))
    setGeometry(next)
  }
  const save = async () => {
    const response = await fetch('/__overview/phone/save', { method: 'POST', body: text })
    if (!response.ok) return setStatus(`Not saved: ${await response.text()}`)
    setSavedText(text)
    setStatus(`Saved ${new Date().toLocaleTimeString()}`)
    setReloads((n) => n + 1)
  }

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key === 's') {
        event.preventDefault()
        void save()
      } else if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (event.key === 'Escape' && here !== '/') {
        setHere(here.slice(0, here.lastIndexOf('/')) || '/')
      }
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  })

  const toWorld = (clientX: number, clientY: number): Vec2 => {
    const matrix = svg.current!.getScreenCTM()!.inverse()
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix)
    return [point.x, point.y]
  }

  const grab = (what: Grab) => (event: PointerEvent) => {
    if (event.button !== 0) return
    event.stopPropagation()
    svg.current!.setPointerCapture(event.pointerId)
    drag.current = {
      grab: what.kind === 'node' ? { ...what, subtree: event.shiftKey } : what,
      start: toWorld(event.clientX, event.clientY),
      client: [event.clientX, event.clientY],
      before: geometry,
      view,
      moved: false,
    }
  }

  const move = (event: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const [cx, cy] = [event.clientX - d.client[0], event.clientY - d.client[1]]
    if (!d.moved && Math.hypot(cx, cy) < 3) return
    d.moved = true
    if (d.grab.kind === 'pan') {
      setView({ ...d.view, x: d.view.x - cx / d.view.zoom, y: d.view.y - cy / d.view.zoom })
      return
    }
    const [x, y] = toWorld(event.clientX, event.clientY)
    setGeometry(shift(d.before, d.grab, [x - d.start[0], y - d.start[1]]))
  }

  const release = () => {
    const d = drag.current
    drag.current = null
    if (!d || d.grab.kind === 'pan') return
    if (d.moved) {
      setHistory(({ past }) => ({ past: [...past.slice(-200), d.before], future: [] }))
      return
    }
    if (d.grab.kind !== 'node') return
    const { path, label } = d.grab
    if (label) {
      const next = structuredClone(geometry)
      next[path].label = SIDES[(SIDES.indexOf(next[path].label!) + 1) % SIDES.length]
      commit(next)
    } else if (layout.branches.has(path)) {
      setHere(chain.includes(path) ? path.slice(0, path.lastIndexOf('/')) || '/' : path)
    }
  }

  const wheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      const [wx, wy] = toWorld(event.clientX, event.clientY)
      const zoom = Math.min(4, Math.max(0.15, view.zoom * Math.exp(-event.deltaY * 0.01)))
      const k = view.zoom / zoom
      setView({ zoom, x: wx - (wx - view.x) * k, y: wy - (wy - view.y) * k })
    } else {
      setView({ ...view, x: view.x + event.deltaX / view.zoom, y: view.y + event.deltaY / view.zoom })
    }
  }

  /** Double-click a branch to add a bend there, or with Shift a twig. */
  const addTo = (branch: GroveBranch) => (event: MouseEvent) => {
    const q = toWorld(event.clientX, event.clientY)
    const next = structuredClone(geometry)
    const spec = next[branch.id].branch!
    if (event.shiftKey) {
      const [x, y] = branch.path.points.reduce((best, p) => (dist(p, q) < dist(best, q) ? p : best))
      spec.limbs = [...(spec.limbs ?? []), [[Math.round(x), Math.round(y)], [Math.round(x + 18), Math.round(y - 22)], [Math.round(x + 30), Math.round(y - 44)]]]
    } else {
      const control = branch.parent === null ? spec.path : [branch.path.points[0], ...spec.path]
      let best = 0
      for (let i = 1; i < control.length - 1; i++) if (toSegment(q, control[i], control[i + 1]) < toSegment(q, control[best], control[best + 1])) best = i
      const at = branch.parent === null ? best + 1 : best
      spec.path = [...spec.path.slice(0, at), [Math.round(q[0]), Math.round(q[1])], ...spec.path.slice(at)]
    }
    commit(next)
  }

  /** Double-click a bend or a twig's point to take it out. */
  const remove = (what: Grab) => (event: MouseEvent) => {
    event.stopPropagation()
    const next = structuredClone(geometry)
    if (what.kind === 'point') {
      const spec = next[what.path].branch!
      if (spec.path.length <= (what.path === '/' ? 2 : 1)) return
      spec.path = spec.path.filter((_, i) => i !== what.index)
    } else if (what.kind === 'limb') {
      const spec = next[what.path].branch!
      const limb = spec.limbs![what.limb].filter((_, i) => i !== what.index)
      spec.limbs = limb.length >= 2 ? spec.limbs!.map((l, i) => (i === what.limb ? limb : l)) : spec.limbs!.filter((_, i) => i !== what.limb)
    }
    commit(next)
  }

  const px = 1 / view.zoom
  const width = size[0] / view.zoom
  const height = size[1] / view.zoom
  const preview = DEVICES[device]
  const fit = Math.min(1, 400 / preview.width, (innerHeight * 0.6) / preview.height)

  return (
    <div className="fixed inset-0 flex bg-page text-ink" style={{ fontSize: 13 }}>
      <svg
        ref={svg}
        className="h-full min-w-0 flex-1 touch-none select-none"
        viewBox={`${view.x} ${view.y} ${width} ${height}`}
        onPointerDown={grab({ kind: 'pan' })}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onWheel={wheel}
      >
        <rect x={view.x} y={view.y} width={width} height={height} fill="#fff" />
        {/* The column the plant has to fit, and the shortest and a tall opening view. */}
        <rect x={0} y={view.y} width={COLUMN} height={Math.max(0, phone.ground - view.y)} fill="#f6f6f6" />
        <rect x={0} y={phone.ground - TALL} width={COLUMN} height={TALL} fill="none" stroke="#c4c4c4" strokeDasharray={`${4 * px} ${4 * px}`} strokeWidth={px} />
        <rect x={0} y={phone.ground - SHORT} width={COLUMN} height={SHORT} fill="none" stroke="#858585" strokeDasharray={`${8 * px} ${6 * px}`} strokeWidth={px} />
        <text x={COLUMN + 8} y={phone.ground - SHORT + 12} fontSize={11 * px} fill="#858585">
          shortest view, {COLUMN} × {SHORT}
        </text>
        <text x={COLUMN + 8} y={phone.ground - TALL + 12} fontSize={11 * px} fill="#a6a6a6">
          tall phone, {COLUMN} × {TALL}
        </text>
        <line x1={view.x} x2={view.x + width} y1={phone.ground} y2={phone.ground} stroke="#111214" strokeWidth={px} />
        <Masthead px={px} />

        {branches.map((branch) => (
          <g key={branch.id} stroke={HUES[(branch.id.split('/').length - (branch.id === '/' ? 2 : 1)) % HUES.length]} fill="none">
            <polyline points={line(branch.path.points)} strokeWidth={branch.width} strokeLinecap="round" opacity={0.55} />
            {branch.limbs.map((limb, i) => (
              <polyline key={i} points={line(limb.points)} strokeWidth={1.5} />
            ))}
            <polyline
              points={line(branch.path.points)}
              stroke="transparent"
              strokeWidth={Math.max(branch.width, 14 * px)}
              onDoubleClick={addTo(branch)}
              style={{ cursor: 'copy' }}
            />
          </g>
        ))}

        {nodes.map((node) => (
          <Node key={node.id} node={node} open={chain.includes(node.id)} flagged={flagged.has(node.id)} onGrab={grab} />
        ))}

        {branches.map((branch) => {
          const spec = geometry[branch.id].branch!
          return (
            <g key={`${branch.id}:handles`}>
              {spec.path.map(([x, y], index) => (
                <rect
                  key={index}
                  x={x - 4 * px}
                  y={y - 4 * px}
                  width={8 * px}
                  height={8 * px}
                  fill="#fff"
                  stroke="#111214"
                  strokeWidth={1.5 * px}
                  style={{ cursor: 'move' }}
                  onPointerDown={grab({ kind: 'point', path: branch.id, index })}
                  onDoubleClick={remove({ kind: 'point', path: branch.id, index })}
                />
              ))}
              {(spec.limbs ?? []).map((limb, li) =>
                limb.map(([x, y], index) => (
                  <circle
                    key={`${li}:${index}`}
                    cx={x}
                    cy={y}
                    r={3 * px}
                    fill="#36c21c"
                    style={{ cursor: 'move' }}
                    onPointerDown={grab({ kind: 'limb', path: branch.id, limb: li, index })}
                    onDoubleClick={remove({ kind: 'limb', path: branch.id, limb: li, index })}
                  />
                )),
              )}
            </g>
          )
        })}
      </svg>

      <aside className="flex w-[440px] shrink-0 flex-col gap-10 overflow-y-auto border-l border-line bg-page p-16">
        <div className="flex items-center gap-8">
          <strong className="font-mondwest text-[22px]">Phone layout</strong>
          <select className="ml-auto" value={device} onChange={(event) => setDevice(Number(event.target.value))}>
            {DEVICES.map((d, i) => (
              <option key={d.label} value={i}>
                {d.label} · {d.width} × {d.height}
              </option>
            ))}
          </select>
        </div>
        <div style={{ width: preview.width * fit, height: preview.height * fit }} className="shrink-0 self-center overflow-hidden rounded-[12px] border border-line">
          <iframe
            key={reloads}
            title="The site on a phone"
            src={here === '/' ? '/' : `${here}/`}
            width={preview.width}
            height={preview.height}
            style={{ transform: `scale(${fit})`, transformOrigin: '0 0', border: 0 }}
          />
        </div>
        <div className="flex items-center gap-6">
          <Button onClick={save} disabled={!dirty}>
            Save ⌘S
          </Button>
          <Button onClick={undo} disabled={!history.past.length}>
            Undo ⌘Z
          </Button>
          <Button onClick={redo} disabled={!history.future.length}>
            Redo ⇧⌘Z
          </Button>
          <span className="ml-auto text-body">{dirty ? 'unsaved' : status || 'saved'}</span>
        </div>
        <p>
          Open: <span className="text-accent">{here}</span>
        </p>
        <div className={problems.length ? 'text-[#c33]' : 'text-body'} data-problems>
          {problems.length ? problems.map((problem, i) => <div key={i}>{problem.text}</div>) : 'Nothing crowded here.'}
        </div>
        {(unplaced.length > 0 || orphans.length > 0) && (
          <div className="text-body">
            {unplaced.map((path) => (
              <div key={path}>new in the tree, placed by its folder: {path}</div>
            ))}
            {orphans.map((path) => (
              <div key={path}>gone from the tree, dropped on save: {path}</div>
            ))}
          </div>
        )}
        <p className="mt-auto text-body leading-[18px]">
          Drag an icon, a name, a bend (□) or a twig (●). <Key>Shift</Key>-drag a folder to move everything in it. Click a
          folder to open it, a name to flip its side. Double-click a branch to add a bend, with <Key>Shift</Key> a twig; double-click a
          bend or twig point to take it out. Scroll to pan, pinch or <Key>Ctrl</Key>-scroll to zoom. <Key>Esc</Key> closes a folder.
        </p>
      </aside>
    </div>
  )
}

function Node({
  node,
  open,
  flagged,
  onGrab,
}: {
  node: GroveNode<Entry>
  open: boolean
  flagged: boolean
  onGrab: (what: Grab) => (event: PointerEvent) => void
}) {
  const glyph = glyphs[node.kind === 'folder' ? (open ? 'openFolder' : 'folder') : glyphFor(node.data)]
  const [x, y] = node.at
  const [w, h] = [glyph.width * CELL, glyph.height * CELL]
  const link = node.data?.kind === 'link'
  const name = `${node.name}${node.kind === 'folder' ? '/' : link ? ' ↗' : ''}`
  const note = node.data?.kind === 'folder' ? node.data.note : undefined
  const area = labelArea(node, { icon: false })
  // Stacked as on the page: the name's line, then the note's, centred on the icon unless below it.
  const lines = 19.2 + (note ? 16.25 : 0)
  const top = node.label === 'below' ? y + h / 2 + 4 : y - lines / 2
  const tx = node.label === 'right' ? x + w / 2 + 8 : node.label === 'left' ? x - w / 2 - 8 : x
  const anchor = node.label === 'right' ? 'start' : node.label === 'left' ? 'end' : 'middle'
  const nodeGrab = onGrab({ kind: 'node', path: node.id, subtree: false, label: false })
  const labelGrab = onGrab({ kind: 'node', path: node.id, subtree: false, label: true })
  return (
    <g>
      {flagged && (
        <rect x={area.minX} y={area.minY} width={area.maxX - area.minX} height={area.maxY - area.minY} fill="#ff000026" stroke="#ff0000" strokeWidth={0.75} />
      )}
      <g transform={`translate(${x - w / 2} ${y - h / 2}) scale(${CELL})`} onPointerDown={nodeGrab} style={{ cursor: 'move' }}>
        <path d={glyph.fill} fill="#f1f1f1" />
        <path d={glyph.outline} fill={link ? '#2d68ff' : node.kind === 'folder' ? '#111214' : '#a6a6a6'} />
        <rect width={glyph.width} height={glyph.height} fill="transparent" />
      </g>
      <g onPointerDown={labelGrab} style={{ cursor: 'pointer', fontFamily: 'PP Neue Montreal' }}>
        <text x={tx} y={top + 19.2 * 0.74} textAnchor={anchor} fontSize={16} fill={link ? '#2d68ff' : '#111214'}>
          {name}
        </text>
        {note && (
          <text x={tx} y={top + 19.2 + 16.25 * 0.74} textAnchor={anchor} fontSize={12.5} fill="#a6a6a6">
            {note}
          </text>
        )}
      </g>
    </g>
  )
}

/** The words standing on the ground, and the hello folder in the corner. */
function Masthead({ px }: { px: number }) {
  const { name, intro, time } = phone.masthead
  const box = (b: Bounds, label: string) => (
    <g>
      <rect x={b.minX} y={b.minY} width={b.maxX - b.minX} height={b.maxY - b.minY} fill="#007bb914" />
      <text x={b.minX + 4} y={b.minY + 12} fontSize={10 * px} fill="#007bb9">
        {label}
      </text>
    </g>
  )
  return (
    <g pointerEvents="none">
      {box(time.box, 'time')}
      {box(intro.box, 'intro')}
      {box(HELLO, 'say hello')}
      <g fontFamily="PP Mondwest" fontSize={name.size} fill="#11121433">
        <text x={name.box.minX} y={name.box.maxY - 0.84 * name.size}>
          Nadid
        </text>
        <text x={name.box.minX} y={name.box.maxY}>
          Azwad
        </text>
      </g>
    </g>
  )
}

function Button({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-[6px] border border-line bg-white px-10 py-4 disabled:cursor-default disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[3px] bg-well px-3 font-sans text-ink">{children}</kbd>
}

/** Every path in the tree with its geometry: what phone.json has, and where `place` puts whatever it lacks. */
function complete(placements: Placements): Placements {
  const out: Placements = {}
  const visit = (folder: FolderSpec<Entry>, id: string) => {
    for (const child of folder.children) {
      const path = id === '/' ? `/${child.name}` : `${id}/${child.name}`
      out[path] = 'branch' in child ? { at: child.at, label: child.label, branch: child.branch } : { at: child.at, label: child.label }
      if ('branch' in child) visit(child, path)
    }
  }
  const tree = place(portfolio, placements)
  out['/'] = { branch: tree.branch }
  visit(tree, '/')
  return structuredClone(out)
}

/** One entry per line, in the tree's order. */
function format(geometry: Placements) {
  const lines = pathsOf(portfolio).map((path) => `  ${JSON.stringify(path)}: ${JSON.stringify(geometry[path]).replaceAll(',', ', ').replaceAll('":', '": ')}`)
  return `{\n${lines.join(',\n')}\n}\n`
}

function shift(before: Placements, grab: Grab, [dx, dy]: Vec2): Placements {
  const next = structuredClone(before)
  const moved = ([x, y]: Vec2): [number, number] => [Math.round(x + dx), Math.round(y + dy)]
  if (grab.kind === 'node') {
    for (const path of Object.keys(next)) {
      if (path !== grab.path && !(grab.subtree && path.startsWith(`${grab.path}/`))) continue
      const placement = next[path]
      placement.at = moved(placement.at!)
      if (grab.subtree && placement.branch) {
        placement.branch.path = placement.branch.path.map(moved)
        placement.branch.limbs = placement.branch.limbs?.map((limb) => limb.map(moved))
      }
    }
  } else if (grab.kind === 'point') {
    next[grab.path].branch!.path[grab.index] = moved(before[grab.path].branch!.path[grab.index])
  } else if (grab.kind === 'limb') {
    next[grab.path].branch!.limbs![grab.limb][grab.index] = moved(before[grab.path].branch!.limbs![grab.limb][grab.index])
  }
  return next
}

function glyphFor(entry: Entry | undefined): GlyphName {
  switch (entry?.kind) {
    case 'image':
      return 'picture'
    case 'video':
      return 'film'
    case 'case':
      return 'page'
    case 'link':
      return 'link'
    default:
      return 'text'
  }
}

/** The column centred on the canvas, from the ground up to well above the opening view. */
function startingView(): View {
  const [width, height] = [innerWidth - 440, innerHeight]
  const zoom = height / 1500
  return { zoom, x: COLUMN / 2 - width / zoom / 2, y: phone.ground + 60 - height / zoom }
}

function useSize(ref: RefObject<Element | null>): Vec2 {
  const [size, setSize] = useState<Vec2>([innerWidth - 440, innerHeight])
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize([entry.contentRect.width, entry.contentRect.height]))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return size
}

const line = (points: readonly Vec2[]) => points.map((p) => p.join(',')).join(' ')
const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1])

function toSegment(p: Vec2, a: Vec2, b: Vec2) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
  return dist(p, [a[0] + t * dx, a[1] + t * dy])
}
