import { labelArea } from '../garden/labels.ts'
import { createGrove, type Bounds, type GroveBranch, type GroveNode, type Vec2 } from '../grove'
import { GROUND, INTRO, portfolio, TIME, type Entry } from '../portfolio'

function distance([px, py]: Vec2, box: Bounds) {
  const dx = Math.max(box.minX - px, 0, px - box.maxX)
  const dy = Math.max(box.minY - py, 0, py - box.maxY)
  return Math.hypot(dx, dy)
}

/** Labels with less breathing room than this from a branch (leaves included) or a twig get flagged. */
const ROOM = { branch: 22, limb: 10 }

/** Dev only: the whole tree opened at once, as lines, for placing branches by eye. */
export default function Overview() {
  const { layout } = createGrove(portfolio)
  const { minX, minY } = layout.bounds
  const [maxX, maxY] = [Math.max(layout.bounds.maxX, 848), GROUND]
  const pad = 160
  const depth = (id: string) => id.split('/').length - 1
  const hues = ['#6b4a33', '#007bb9', '#d19a3d', '#36c21c', '#4fa3e0', '#8f9a22']
  const branches = [...layout.branches.values()]
  const crowding = (node: GroveNode<Entry>) => {
    const box = labelArea(node, { icon: false })
    // Every icon hangs off its parent's branch, and a folder's own branch leaves from its corner.
    const expected = (branch: GroveBranch, p: Vec2) =>
      (branch.id === node.parent || branch.id === node.id) && Math.hypot(p[0] - node.at[0], p[1] - node.at[1]) < 50
    return branches.filter(
      (branch) =>
        branch.path.points.some((p) => !expected(branch, p) && distance(p, box) < ROOM.branch) ||
        branch.limbs.some((limb) => limb.points.some((p) => distance(p, box) < ROOM.limb)),
    )
  }
  const crowded = new Set(layout.nodes.filter((node) => crowding(node).length).map((node) => node.id))
  for (const node of layout.nodes) {
    const near = crowding(node)
    if (near.length) console.info(`crowded: ${node.id} by ${near.map((branch) => branch.id).join(', ')}`)
  }
  return (
    <svg
      className="block"
      viewBox={`${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`}
      style={{ width: '100vw', height: '100vh', background: '#fff' }}
    >
      {/* The opening view at 1440 × 900, the ground, and the masthead standing on it: keep branches out. */}
      <rect x={-432} y={GROUND - 800} width={1280} height={800} fill="none" stroke="#a6a6a6" strokeDasharray="8 6" />
      <rect x={-404} y={GROUND - 159} width={1094} height={159} fill="#1112140a" />
      <rect x={-404} y={GROUND - 48} width={328} height={48} fill="#11121422" />
      {[INTRO, TIME].map((box, i) => (
        <rect key={i} x={box.minX} y={box.minY} width={box.maxX - box.minX} height={box.maxY - box.minY} fill="#007bb91a" />
      ))}
      <line x1={-480} x2={maxX + pad} y1={GROUND} y2={GROUND} stroke="#111214" />
      {[...layout.branches.values()].map((branch) => (
        <g key={branch.id} stroke={hues[depth(branch.id === '/' ? '' : branch.id) % hues.length]} fill="none">
          <polyline points={branch.path.points.map((p) => p.join(',')).join(' ')} strokeWidth={branch.width} strokeLinecap="round" opacity={0.55} />
          {branch.limbs.map((limb, i) => (
            <polyline key={i} points={limb.points.map((p) => p.join(',')).join(' ')} strokeWidth={1.5} />
          ))}
        </g>
      ))}
      {layout.nodes.map((node) => {
        const box = labelArea(node, { icon: false })
        return (
          <rect
            key={`${node.id}:box`}
            x={box.minX}
            y={box.minY}
            width={box.maxX - box.minX}
            height={box.maxY - box.minY}
            fill={crowded.has(node.id) ? '#ff000033' : 'none'}
            stroke={crowded.has(node.id) ? '#ff0000' : 'none'}
          />
        )
      })}
      {layout.nodes.map((node) => (
        <g key={node.id} transform={`translate(${node.at[0]} ${node.at[1]})`}>
          <rect x={-10} y={-9} width={20} height={18} fill={node.kind === 'folder' ? '#16130f' : '#fff'} stroke="#16130f" />
          <text
            x={node.label === 'right' ? 18 : node.label === 'left' ? -18 : 0}
            y={node.label === 'below' ? 30 : 5}
            textAnchor={node.label === 'right' ? 'start' : node.label === 'left' ? 'end' : 'middle'}
            fontSize={16}
            fill="#16130f"
          >
            {node.name}
            {node.kind === 'folder' ? '/' : ''}
          </text>
          {node.data?.kind === 'folder' && node.data.note && (
            <text
              x={node.label === 'right' ? 18 : node.label === 'left' ? -18 : 0}
              y={node.label === 'below' ? 46 : 21}
              textAnchor={node.label === 'right' ? 'start' : node.label === 'left' ? 'end' : 'middle'}
              fontSize={12.5}
              fill="#a6a6a6"
            >
              {node.data.note}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
