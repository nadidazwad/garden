import { useEffect, useRef } from 'react'
import { PixelIcon } from '../icons'

// Placeholder until the domain is chosen.
const EMAIL = 'hello@azwad.me'

const WAYS = [
  { label: EMAIL, href: `mailto:${EMAIL}` },
  { label: 'x.com/nadidazwad', href: 'https://x.com/nadidazwad' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/nadid-azwad-311833318' },
  { label: 'github', href: 'https://github.com/nadidazwad' },
]

interface Props {
  open: boolean
  onToggle: (open: boolean) => void
  /** One icon pixel in CSS px, so the folder sits on the plant's grid. */
  pixel: number
}

/** The hello folder, pinned to the corner. Opening it lists the ways to reach me. */
export function Contact({ open, onToggle, pixel }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) onToggle(false)
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
          const order = WAYS.length - 1 - i
          return (
            <li
              key={way.href}
              className="transition-[opacity,translate] duration-300 ease-out-expo"
              style={{
                opacity: open ? 1 : 0,
                translate: open ? '0 0' : '0 10px',
                transitionDelay: open ? `${order * 40}ms` : '0ms',
              }}
            >
              <a
                href={way.href}
                tabIndex={open ? 0 : -1}
                {...(way.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="halo group flex items-center gap-6 text-small text-ink outline-none transition-colors duration-150 hover:text-accent focus-visible:text-accent"
              >
                {way.label}
                <span className="text-muted transition-[color,translate] duration-200 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:text-accent">
                  ↗
                </span>
              </a>
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
        <PixelIcon
          name={open ? 'helloOpen' : 'hello'}
          pixel={pixel}
          className={`transition-colors duration-150 group-hover:text-accent group-focus-visible:text-accent ${open ? 'text-accent' : 'text-ink'}`}
        />
      </button>
    </div>
  )
}
