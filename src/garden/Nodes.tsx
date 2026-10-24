import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import type { Grove, GroveNode } from '../grove'
import { fileGlyph, glyphs, PixelIcon, type GlyphName } from '../icons'

interface Props {
  grove: Grove
  scale: number
  dpr: number
  width: number
  height: number
}

/** Icons and names for every file and folder, pinned to where the plant draws them. */
export function Nodes({ grove, scale, dpr, width, height }: Props) {
  useSyncExternalStore(grove.subscribe, () => grove.version)
  const anchors = useRef(new Map<string, HTMLDivElement>())

  useLayoutEffect(() => {
    const place = () => {
      const [cx, cy] = grove.camera
      for (const node of grove.layout.nodes) {
        const anchor = anchors.current.get(node.id)
        if (!anchor) continue
        const x = Math.round(((node.at[0] - cx) * scale + width / 2) * dpr) / dpr
        const y = Math.round(((node.at[1] - cy) * scale + height / 2) * dpr) / dpr
        anchor.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }
    place()
    return grove.onFrame(place)
  }, [grove, scale, dpr, width, height])

  return (
    <div className="pointer-events-none absolute inset-0 select-none" role="tree" aria-label="Documents">
      {grove.layout.nodes.map((node) => (
        <div
          key={node.id}
          ref={(element) => {
            if (element) anchors.current.set(node.id, element)
            else anchors.current.delete(node.id)
          }}
          className="absolute left-0 top-0 transition-[opacity,visibility] duration-150 ease-out data-hidden:invisible data-hidden:opacity-0"
          data-hidden={grove.isVisible(node.id) ? undefined : ''}
          inert={!grove.isVisible(node.id)}
        >
          {/* Scales about the icon's centre, which is this wrapper's origin. */}
          <div className={`absolute left-0 top-0 origin-top-left ${grove.isVisible(node.id) ? 'motion-safe:animate-pop' : ''}`}>
            {node.kind === 'folder' ? (
              <Folder node={node} open={grove.isOpen(node.id)} onToggle={() => grove.toggle(node.id)} />
            ) : (
              <File node={node} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const LABEL = 'whitespace-nowrap text-[length:calc(var(--spacing)*16)] leading-[1.2]'

function Folder({ node, open, onToggle }: { node: GroveNode; open: boolean; onToggle: () => void }) {
  const glyph: GlyphName = open ? 'openFolder' : 'folder'
  return (
    <Anchor glyph={glyph} below={node.label === 'below'}>
      <button
        type="button"
        role="treeitem"
        aria-expanded={open}
        onClick={onToggle}
        className={`group pointer-events-auto flex cursor-pointer items-center rounded-[4px] outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent ${node.label === 'below' ? 'flex-col gap-4' : 'gap-8'}`}
      >
        <PixelIcon
          name={glyph}
          className={`transition-colors duration-150 group-hover:text-accent ${open ? 'text-ink' : 'text-muted'}`}
        />
        {/* An open folder's name steps back; its contents are what matter now. */}
        <span className={`${LABEL} transition-colors duration-150 group-hover:text-accent ${open ? 'text-muted' : 'text-ink'}`}>
          {node.name}/
        </span>
      </button>
    </Anchor>
  )
}

function File({ node }: { node: GroveNode }) {
  const glyph = fileGlyph(node.name)
  return (
    <Anchor glyph={glyph} below={node.label === 'below'}>
      <span role="treeitem" className={`flex items-center ${node.label === 'below' ? 'flex-col gap-4' : 'gap-8'}`}>
        <PixelIcon name={glyph} className="text-faint" />
        <span className={`${LABEL} text-body`}>{node.name}</span>
      </span>
    </Anchor>
  )
}

/** Centres the icon on the node's point; the name sits to its right or underneath. */
function Anchor({ glyph, below, children }: { glyph: GlyphName; below: boolean; children: ReactNode }) {
  const { width, height } = glyphs[glyph]
  return (
    <div
      className={below ? 'absolute flex w-240 justify-center' : 'absolute flex items-center'}
      style={{
        left: below ? 'calc(var(--spacing) * -120)' : `calc(var(--px) * ${-width / 2})`,
        top: `calc(var(--px) * ${-height / 2})`,
        height: below ? undefined : `calc(var(--px) * ${height})`,
      }}
    >
      {children}
    </div>
  )
}
