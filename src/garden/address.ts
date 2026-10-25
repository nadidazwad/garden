import { useEffect } from 'react'
import { ROOT_ID, type Grove } from '../grove'
import { opensAs, type Entry } from '../portfolio'

const NAME = 'Nadid Azwad'

/** The address bar and its history, as far as the garden needs them. */
export interface Address {
  readonly path: string
  /** True when the current entry was pushed on top of the tree's, so stepping back lands on the tree. */
  readonly stacked: boolean
  push(path: string, title: string): void
  /** Swaps the current entry, keeping whether it was stacked. */
  replace(path: string, title: string): void
  back(): void
  /** Called when the visitor moves through history. */
  onPop(listener: () => void): () => void
}

/**
 * Keeps the address bar and the tree in step. Only a case study has an address
 * of its own; the tree, its folders and the files that preview over it all
 * live at `/`. So reloading starts the plant afresh, unless you were reading a
 * case study: that opens again, with the plant grown to where it sits behind
 * it. Opening one pushes history and Back puts it down; Next swaps it in place.
 */
export function syncAddress(grove: Grove<Entry>, address: Address) {
  const nodes = new Map(grove.layout.nodes.map((node) => [node.id, node]))
  const pageAt = (path: string) => {
    const id = path.length > 1 ? path.replace(/\/+$/, '') : path
    return opensAs(nodes.get(id)?.data) === 'page' ? id : null
  }
  const urlOf = (page: string | null) => (page ? encodeURI(page) : '/')
  const titleOf = (page: string | null) => {
    const node = page ? nodes.get(page) : undefined
    return node ? `${nodes.get(node.parent)?.name ?? ''}/${node.name} — ${NAME}` : NAME
  }
  const decoded = () => {
    try {
      return decodeURIComponent(address.path)
    } catch {
      return ROOT_ID
    }
  }

  // The page the address shows, if any. Set before the grove moves, so its listener sees nothing to do.
  let shown = pageAt(decoded())
  // Our own step back, on its way through history.
  let stepping = false
  if (shown) grove.go(shown)
  address.replace(urlOf(shown), titleOf(shown))

  const unsubscribe = grove.subscribe(() => {
    const page = pageAt(grove.location)
    if (page === shown) return
    const was = shown
    shown = page
    if (!was) address.push(urlOf(page), titleOf(page))
    else if (page) address.replace(urlOf(page), titleOf(page))
    else if (address.stacked) {
      stepping = true
      address.back()
    } else address.replace(urlOf(null), titleOf(null))
  })

  const offPop = address.onPop(() => {
    if (stepping) stepping = false
    else {
      const page = pageAt(decoded())
      const leaving = shown
      shown = page
      if (page) grove.go(page)
      else if (leaving) grove.close(leaving)
    }
    // History brings back the address but not the title.
    address.replace(urlOf(shown), titleOf(shown))
  })

  return () => {
    unsubscribe()
    offPop()
  }
}

/** The browser's own address bar. */
export function windowAddress(): Address {
  const set = (title: string) => (document.title = title)
  return {
    get path() {
      return location.pathname
    },
    get stacked() {
      return history.state?.stacked === true
    },
    push(path, title) {
      history.pushState({ stacked: true }, '', path)
      set(title)
    },
    replace(path, title) {
      history.replaceState(history.state, '', path)
      set(title)
    },
    back: () => history.back(),
    onPop(listener) {
      window.addEventListener('popstate', listener)
      return () => window.removeEventListener('popstate', listener)
    },
  }
}

export function useAddress(grove: Grove<Entry>) {
  useEffect(() => syncAddress(grove, windowAddress()), [grove])
}
