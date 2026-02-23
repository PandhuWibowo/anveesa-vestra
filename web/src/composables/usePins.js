import { ref } from 'vue'

const STORAGE_KEY = 'anveesa-pinned'

function loadPins() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function savePins(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

const pinned = ref(loadPins())

export function usePins() {
  function isPinned(provider, id) {
    return pinned.value.has(`${provider}:${id}`)
  }

  function togglePin(provider, id) {
    const key = `${provider}:${id}`
    const next = new Set(pinned.value)
    next.has(key) ? next.delete(key) : next.add(key)
    pinned.value = next
    savePins(next)
  }

  return { pinned, isPinned, togglePin }
}
