import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react'
import type { Grove, GroveNode, LabelSide } from '../grove'
import { glyphs, PixelIcon, type GlyphName } from '../icons'
import type { Entry } from '../portfolio'
import { toScreen, type View } from './view.ts'

interface Props {
  grove: Grove<Entry>
  view: View
  onOpen: (node: GroveNode<Entry>) => void
}

/** Icons and names for every file and folder, pinned to where the plant draws them. */
export function Nodes({ grove, view, onOpen }: Props) {
  useSyncExternalStore(grove.subscribe, () => grove.version)
  const anchors = useRef(new Map<string, HTMLDivElement>())

  useLayoutEffect(() => {
    const place = () => {
      for (const node of grove.layout.nodes) {
        const anchor = anchors.current.get(node.id)
        if (!anchor) continue
        const [x, y] = toScreen(grove, view, node.at)
        anchor.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }
    place()
    return grove.onFrame(place)
  }, [grove, view])

  return (
    <div className="pointer-events-none absolute inset-0 select-none" role="tree" aria-label="Nadid Azwad’s work">
      {grove.layout.nodes.map((node) => {
        const visible = grove.isVisible(node.id)
        return (
          <div
            key={node.id}
            ref={(element) => {
              if (element) anchors.current.set(node.id, element)
              else anchors.current.delete(node.id)
            }}
            // Links sit above everything else on the plant.
            className={`absolute left-0 top-0 transition-[opacity,visibility] duration-150 ease-out data-hidden:invisible data-hidden:opacity-0 ${node.data?.kind === 'link' ? 'z-10' : ''}`}
            data-hidden={visible ? undefined : ''}
            inert={!visible}
          >
            {/* Scales about the icon's centre, which is this wrapper's origin. */}
            <div className={`absolute left-0 top-0 origin-top-left ${visible ? 'motion-safe:animate-pop' : ''}`}>
              {node.kind === 'folder' ? (
                <Folder node={node} open={grove.isOpen(node.id)} here={grove.location === node.id} onToggle={() => grove.toggle(node.id)} />
              ) : (
                <File node={node} here={grove.location === node.id} onOpen={() => onOpen(node)} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const LABEL = 'halo whitespace-nowrap text-[length:calc(var(--spacing)*16)] leading-[1.2]'
const NOTE = 'halo whitespace-nowrap text-[length:calc(var(--spacing)*12.5)] leading-[1.3] text-muted'

function Folder({ node, open, here, onToggle }: { node: GroveNode<Entry>; open: boolean; here: boolean; onToggle: () => void }) {
  const glyph: GlyphName = open ? 'openFolder' : 'folder'
  const entry = node.data?.kind === 'folder' ? node.data : undefined
  const hover = 'group-hover:text-accent group-focus-visible:text-accent'
  return (
    <Item
      node={node}
      glyph={glyph}
      expanded={open}
      onClick={onToggle}
      iconClass={`${open ? 'text-ink' : 'text-muted'} ${hover}`}
      // An open folder's name steps back; its contents are what matter now.
      labelClass={`${open && !here ? 'text-muted' : 'text-ink'} ${hover} group-focus-visible:underline`}
      name={`${node.name}/`}
      note={entry?.note}
    />
  )
}

function File({ node, here, onOpen }: { node: GroveNode<Entry>; here: boolean; onOpen: () => void }) {
  const entry = node.data
  const link = entry?.kind === 'link'
  const hover = 'group-hover:text-accent group-focus-visible:text-accent'
  return (
    <Item
      node={node}
      glyph={glyphFor(entry)}
      onClick={onOpen}
      current={here}
      iconClass={link ? 'text-accent' : `${here ? 'text-accent' : 'text-faint'} ${hover}`}
      // Links are somewhere to go, so they stand out in the accent; hovering underlines them.
      labelClass={
        link
          ? 'text-accent group-hover:underline group-focus-visible:underline'
          : `${here ? 'text-ink' : 'text-body'} ${hover} group-focus-visible:underline`
      }
      name={`${node.name}${link ? ' ↗' : ''}`}
    />
  )
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

interface ItemProps {
  node: GroveNode<Entry>
  glyph: GlyphName
  name: string
  note?: string
  iconClass: string
  labelClass: string
  expanded?: boolean
  current?: boolean
  onClick: () => void
}

/**
 * The icon sits centred on the node's point; the name hangs off it to the
 * right, the left, or underneath. The whole thing is one button, as big as the icon.
 */
function Item({ node, glyph, name, note, iconClass, labelClass, expanded, current, onClick }: ItemProps) {
  const { width, height } = glyphs[glyph]
  const px = (n: number) => `calc(var(--px) * ${n})`
  const gap = 'calc(var(--spacing) * 8)'
  const side: LabelSide = node.label
  const label: CSSProperties =
    side === 'right'
      ? { left: `calc(100% + ${gap})`, top: '50%', transform: 'translateY(-50%)' }
      : side === 'left'
        ? { right: `calc(100% + ${gap})`, top: '50%', transform: 'translateY(-50%)', textAlign: 'right' }
        : { left: '50%', top: 'calc(100% + var(--spacing) * 4)', transform: 'translateX(-50%)', textAlign: 'center' }
  return (
    <button
      type="button"
      role="treeitem"
      aria-expanded={expanded}
      aria-current={current || undefined}
      onClick={onClick}
      className="group pointer-events-auto absolute block cursor-pointer outline-none"
      style={{ left: px(-width / 2), top: px(-height / 2), width: px(width), height: px(height) }}
    >
      <PixelIcon name={glyph} data-glyph={node.id} className={`block transition-colors duration-150 ${iconClass}`} />
      <span className="absolute flex flex-col" style={label}>
        <span className={`${LABEL} decoration-1 underline-offset-3 transition-colors duration-150 ${labelClass}`}>
          {name}
        </span>
        {note && <span className={NOTE}>{note}</span>}
      </span>
    </button>
  )
}
