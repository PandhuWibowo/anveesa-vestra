import { ref } from 'vue'

const STORAGE_KEY = 'anveesa-bookmarks'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}
function persist(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

const bookmarks = ref(load())

export function useBookmarks() {
  function isBookmarked(provider, id, prefix) {
    return bookmarks.value.some(
      b => b.provider === provider && String(b.id) === String(id) && b.prefix === prefix
    )
  }

  function toggleBookmark(provider, id, bucket, prefix, connName) {
    const idx = bookmarks.value.findIndex(
      b => b.provider === provider && String(b.id) === String(id) && b.prefix === prefix
    )
    if (idx >= 0) {
      bookmarks.value = bookmarks.value.filter((_, i) => i !== idx)
    } else {
      const label = prefix
        ? prefix.replace(/\/$/, '').split('/').pop()
        : bucket
      bookmarks.value = [
        ...bookmarks.value,
        { provider, id: String(id), bucket, prefix, label, connName },
      ]
    }
    persist(bookmarks.value)
  }

  function removeBookmark(provider, id, prefix) {
    bookmarks.value = bookmarks.value.filter(
      b => !(b.provider === provider && String(b.id) === String(id) && b.prefix === prefix)
    )
    persist(bookmarks.value)
  }

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark }
}
