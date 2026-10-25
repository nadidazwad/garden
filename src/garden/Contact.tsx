import { useEffect, useRef } from 'react'
import { PixelIcon } from '../icons'
import { sound } from '../sound'

const EMAIL = 'nadidazwad@gmail.com'

// X has no href yet: the new account is still to come, and it says so instead of linking.
const WAYS: { label: string; href?: string }[] = [
  { label: EMAIL, href: `mailto:${EMAIL}` },
  { label: 'x · new account soon' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/nadidazwad/' },
  { label: 'github', href: 'https://github.com/nadidazwad' },
]

interface Props {
  open: boolean
  onToggle: (open: boolean) => void
  /** One icon pixel in CSS px, so the folder sits on the plant's grid. */
  pixel: number
}

/** How far apart the ways rise in, in ms; each rings a note as it arrives. */
const STAGGER = 55
/** The hello corner is bottom right, so that's where its sounds come from. */
const PAN = 0.6

/** The hello folder, pinned to the corner. Opening it lists the ways to reach me. */
export function Contact({ open, onToggle, pixel }: Props) {
  const root = useRef<HTMLDivElement>(null)

  // Opening knocks and the ways ring in a note at a time as they rise, climbing; shutting knocks lower.
  const was = useRef(open)
  useEffect(() => {
    if (was.current === open) return
    was.current = open
    if (!open) return sound.play('close', { pan: PAN })
    sound.play('open', { pan: PAN })
    WAYS.forEach((_, rise) => sound.play('sprout', { step: 3 + rise, delay: 0.05 + (rise * STAGGER) / 1000, pan: PAN }))
  }, [open])

  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      const target = event.target as Element
      if (!root.current?.contains(target) && !target.closest?.('[data-contact-toggle]')) onToggle(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle(false)
    }
    window.addEventListener('pointerdown', away)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', escape)
    }
  }, [open, onToggle])

  return (
    <div ref={root} className="fixed bottom-26 right-30 z-10 flex flex-col items-end">
      <ul
        id="contact-ways"
        className={`mb-14 flex flex-col items-end gap-10 ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        {WAYS.map((way, i) => {
          // They rise in from the bottom one after another, and leave from the top, quicker.
          const rise = WAYS.length - 1 - i
          return (
            <li
              key={way.label}
              className={`motion-safe:transition-[opacity,translate,filter] ${open ? 'duration-420 ease-out-expo' : 'duration-180 ease-in'}`}
              style={{
                opacity: open ? 1 : 0,
                translate: open ? '0 0' : '0 8px',
                filter: open ? 'none' : 'blur(2px)',
                transitionDelay: open ? `${50 + rise * STAGGER}ms` : `${i * 25}ms`,
              }}
            >
              {way.href ? (
                <a
                  href={way.href}
                  tabIndex={open ? 0 : -1}
                  {...(way.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                  onPointerEnter={(event) => event.pointerType === 'mouse' && sound.play('hover', { pan: PAN })}
                  onClick={() => sound.play('link', { pan: PAN })}
                  className="halo group flex items-center gap-6 text-small text-ink outline-none transition-colors duration-150 hover:text-accent focus-visible:text-accent"
                >
                  <span className="line-draw group-hover:line-drawn group-focus-visible:line-drawn">{way.label}</span>
                  <span className="text-muted transition-[color,translate] duration-200 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:text-accent">
                    ↗
                  </span>
                </a>
              ) : (
                // Not a way yet: quieter, and nothing to click.
                <span className="halo block text-small text-muted">{way.label}</span>
              )}
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="contact-ways"
        onClick={() => onToggle(!open)}
        // On a phone the plant passes under the corner; a soft plate of page keeps the folder legible over it.
        className="group flex cursor-pointer items-center gap-8 outline-none max-sm:rounded-[12px] max-sm:bg-page max-sm:shadow-[0_0_10px_8px_var(--color-page)]"
      >
        <span
          className={`text-small transition-colors duration-150 group-hover:text-accent group-focus-visible:text-accent ${open ? 'text-accent' : 'text-ink'}`}
        >
          say hello
        </span>
        {/* Shut, the face on the folder winks at the pointer. */}
        <span className={`relative block transition-colors duration-150 group-hover:text-accent group-focus-visible:text-accent ${open ? 'text-accent' : 'text-ink'}`}>
          <PixelIcon name={open ? 'helloOpen' : 'hello'} pixel={pixel} className={`block ${open ? '' : 'group-hover:opacity-0'}`} />
          {!open && <PixelIcon name="helloWink" pixel={pixel} className="absolute inset-0 opacity-0 group-hover:opacity-100" />}
        </span>
      </button>
    </div>
  )
}
