import { sound } from '../sound'

/**
 * Plays a film with its sound on, and the welcome tune bows out for it. Where the
 * browser refuses sound, it plays muted instead and `onMuted` says so.
 */
export function playWithSound(element: HTMLVideoElement | null, onMuted: () => void) {
  if (!element) return
  element.muted = false
  element.play().then(
    () => sound.hush(),
    () => {
      element.muted = true
      onMuted()
      element.play().catch(() => {})
    },
  )
}
