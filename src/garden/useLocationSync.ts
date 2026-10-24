import { useEffect } from 'react'
import { ROOT_ID, type Grove } from '../grove'
import { opensAs, type Entry } from '../portfolio'

const NAME = 'Nadid Azwad'

/**
 * Keeps the address bar and the tree in step: the URL is the path of whatever
 * is open, a folder with a trailing slash. Opening things pushes history, so
 * Back steps out one file or folder at a time; arriving on a deep link grows
 * the plant to it.
 */
export function useLocationSync(grove: Grove<Entry>) {
  useEffect(() => {
    const nodes = new Map(grove.layout.nodes.map((node) => [node.id, node]))
    const urlOf = (id: string) => encodeURI(id === ROOT_ID ? '/' : nodes.get(id)?.kind === 'folder' ? `${id}/` : id)
    const titleOf = (id: string) => {
      const node = nodes.get(id)
      if (!node) return NAME
      return `${node.name}${node.kind === 'folder' ? '/' : ''} — ${NAME}`
    }

    let following = false
    let last = grove.location
    const arrive = () => {
      following = true
      grove.go(decodeURIComponent(location.pathname))
      // A link can't open a new tab on arrival; show the folder it's in instead.
      const node = nodes.get(grove.location)
      if (node && opensAs(node.data) === 'tab') grove.close(node.id)
      following = false
      last = grove.location
      document.title = titleOf(last)
      if (urlOf(last) !== location.pathname) history.replaceState(null, '', urlOf(last))
    }
    arrive()

    const unsubscribe = grove.subscribe(() => {
      if (following || grove.location === last) return
      last = grove.location
      document.title = titleOf(last)
      history.pushState(null, '', urlOf(last))
    })
    window.addEventListener('popstate', arrive)
    return () => {
      unsubscribe()
      window.removeEventListener('popstate', arrive)
    }
  }, [grove])
}
