import { ref } from 'vue'

// Module-level singleton so both panes share the same drag state
const dragState = ref(null) // { entry, conn, currentPrefix, paneId }

export function useDragState() {
  function startPaneDrag(entry, conn, currentPrefix, paneId) {
    dragState.value = { entry, conn, currentPrefix, paneId }
  }
  function clearPaneDrag() {
    dragState.value = null
  }
  return { dragState, startPaneDrag, clearPaneDrag }
}
