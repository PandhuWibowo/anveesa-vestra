import { ref } from 'vue'

// Module-level singleton — renders one confirm dialog at a time.
// options: { confirmLabel = 'Confirm', danger = true }
const pending = ref(null) // { title, message, confirmLabel, danger, resolve }

export function useConfirm() {
  function confirm(message, title = 'Are you sure?', options = {}) {
    return new Promise(resolve => {
      pending.value = {
        title,
        message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        danger: options.danger ?? true,
        resolve,
      }
    })
  }

  function respond(result) {
    if (pending.value) {
      pending.value.resolve(result)
      pending.value = null
    }
  }

  return { pending, confirm, respond }
}
