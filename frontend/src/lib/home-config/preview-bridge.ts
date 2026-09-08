import type { HomeConfig, SectionId } from './types'

export const TJ_PREVIEW_BRIDGE = 'tj:home'

export type EditorMode = 'select' | 'view'

export type ElementKey =
  | 'logo'
  | 'nav'
  | 'hero'
  | 'soulCinema'
  | 'portfolio'
  | 'reviews'
  | 'contact'
  | 'footer'

/** Axis-aligned rect in iframe-viewport (unscaled) CSS pixels. */
export interface RectPayload {
  left: number
  top: number
  width: number
  height: number
}

export type DragElement = 'logo' | 'nav'

export type PreviewMessage =
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'ready' }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'config'; config: HomeConfig }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'select'; section: SectionId }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'highlight'; section: SectionId | null }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'setMode'; mode: EditorMode }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'scrollTo'; section: SectionId }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'element'; section: SectionId; element: ElementKey }
  | {
      bridge: typeof TJ_PREVIEW_BRIDGE
      type: 'dragstart'
      element: DragElement
      header: RectPayload
      box: RectPayload
      other: RectPayload | null
    }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'dragmove'; element: DragElement; dx: number; dy: number }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'dragend'; element: DragElement }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'filmSelect'; id: string; rect: RectPayload }
  | { bridge: typeof TJ_PREVIEW_BRIDGE; type: 'filmHighlight'; id: string | null }

export function parsePreviewMessage(data: unknown): PreviewMessage | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.bridge !== TJ_PREVIEW_BRIDGE) return null
  return d as unknown as PreviewMessage
}

export function sendToFrame(win: Window, msg: PreviewMessage) {
  win.postMessage(msg, window.location.origin)
}

export function sendToParent(msg: PreviewMessage) {
  window.parent.postMessage(msg, window.location.origin)
}