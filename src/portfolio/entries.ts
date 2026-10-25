// What each file in the tree is, and what opening it shows. Media is named by
// its path in the tree (see `media.ts`), so nothing here points at a URL for it.

export interface Link {
  label: string
  href: string
}

export type Entry =
  | {
      kind: 'folder'
      /** A second, quieter line under the folder's name: who it was for, what I did. */
      note?: string
    }
  | { kind: 'image'; caption: string; meta?: string; alt: string; link?: Link }
  | { kind: 'video'; caption: string; meta?: string; link?: Link }
  | { kind: 'text'; body: string }
  /** A case study, written in Markdown. */
  | { kind: 'case'; body: string }
  | { kind: 'link'; href: string }

export type EntryKind = Entry['kind']

/** What opening a file does: a preview over the plant, a full page, or a new tab. */
export function opensAs(entry: Entry | undefined): 'preview' | 'page' | 'tab' | 'none' {
  switch (entry?.kind) {
    case 'image':
    case 'video':
    case 'text':
      return 'preview'
    case 'case':
      return 'page'
    case 'link':
      return 'tab'
    default:
      return 'none'
  }
}
