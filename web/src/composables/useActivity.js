import { ref } from 'vue'

const activities = ref([])
let nextId = 1

const ICONS = {
  upload:   'upload',
  download: 'download',
  delete:   'delete',
  transfer: 'transfer',
  zip:      'zip',
  rename:   'rename',
  folder:   'folder',
  copy:     'copy',
}

export function useActivity() {
  function log(type, message, provider) {
    activities.value = [
      { id: nextId++, type, message, provider, icon: ICONS[type] ?? 'info', time: new Date() },
      ...activities.value,
    ].slice(0, 200)
  }

  function clear() { activities.value = [] }

  return { activities, log, clear }
}
