<template>
  <aside class="sidebar" :aria-hidden="hidden" :inert="hidden">
   <div class="sidebar__inner">
    <!-- Title-bar row: room for the window controls + toggle, then the brand -->
    <div class="sidebar__top">
      <div class="brand-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 6 6 0 0 0-11.8-1A4 4 0 0 0 3 15z"/>
        </svg>
      </div>
      <span class="brand-name">Vestra</span>
    </div>

    <div class="sidebar__body">
      <!-- Primary navigation -->
      <nav class="nav-list">
        <button v-for="item in primaryNav" :key="item.view"
          class="nav-item" :class="{ 'is-active': activeView === item.view }"
          :title="item.label"
          @click="$emit('navigate', item.view)">
          <span class="nav-item__icon" v-html="item.icon"></span>
          <span class="nav-item__label">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Storage connections -->
      <section class="nav-section">
        <div class="nav-section__hd">
          <span class="nav-section__title">Storage</span>
          <button class="nav-section__add" @click="$emit('new-connection')" title="Add storage (N)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <div v-if="connections.length > 5" class="sidebar-search">
          <svg class="sidebar-search__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>
          <input class="sidebar-search__input" v-model="query" placeholder="Filter" aria-label="Filter connections" />
        </div>

        <div class="prov-filter" v-if="connections.length > 5 && availableProviders.length > 1">
          <button v-for="prov in availableProviders" :key="prov"
            class="prov-chip" :class="{ 'is-active': filterProviders.has(prov) }"
            @click="toggleFilter(prov)">
            <ProviderIcon :provider="prov" :size="10" />
            {{ PROV_SHORT[prov] ?? prov }}
          </button>
        </div>

        <SkeletonLoader v-if="loading" :count="3" height="34px" />

        <template v-else>
          <button v-if="!connections.length" class="sidebar-cta" @click="$emit('new-connection')">
            <span class="sidebar-cta__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span>
            <span>Add storage</span>
          </button>

          <div v-for="c in filtered" :key="c.provider + '-' + c.id"
            class="conn-item"
            :class="{ 'is-active': activeConn?.id === c.id && activeConn?.provider === c.provider, 'has-menu': menuFor === keyOf(c) }"
            role="button" tabindex="0" :title="`${c.name} · ${c.bucket}`"
            @click="$emit('select', c)"
            @contextmenu.prevent="openMenuAtPoint($event, connMenu(c), keyOf(c))"
            @keydown.enter="$emit('select', c)"
            @keydown.space.prevent="$emit('select', c)">
            <div class="conn-badge" :class="`conn-badge--${c.provider}`">
              <ProviderIcon :provider="c.provider" :size="12" />
            </div>
            <span class="conn-item__name">{{ c.name }}</span>
            <span v-if="isPinned(c.provider, c.id)" class="conn-item__pin" aria-label="Pinned">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3a1 1 0 0 1 .7 1.7L15 6.4v4.2l2.7 2.7a1 1 0 0 1-.7 1.7h-4v5.5a1 1 0 0 1-2 0V15H7a1 1 0 0 1-.7-1.7L9 10.6V6.4L7.3 4.7A1 1 0 0 1 8 3z"/></svg>
            </span>
            <button class="conn-item__more" :class="{ 'is-open': menuFor === keyOf(c) }" aria-label="More actions" aria-haspopup="menu"
              @click.stop="openMenuAt($event.currentTarget, connMenu(c), keyOf(c))">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
            </button>
          </div>

          <p v-if="connections.length && !filtered.length" class="sidebar-hint">No matches</p>
        </template>
      </section>

      <!-- Bookmarks -->
      <section v-if="bookmarks.length" class="nav-section">
        <div class="nav-section__hd">
          <span class="nav-section__title">Favorites</span>
        </div>
        <div v-for="bm in bookmarks" :key="bm.provider + bm.id + bm.prefix"
          class="conn-item"
          :class="{ 'is-active': activeConn?.id === bm.id && activeConn?.provider === bm.provider && activePrefix === bm.prefix, 'has-menu': menuFor === bmKey(bm) }"
          role="button" tabindex="0"
          :title="`${bm.connName} / ${bm.prefix || bm.bucket}`"
          @click="$emit('bookmark-navigate', bm)"
          @contextmenu.prevent="openMenuAtPoint($event, bookmarkMenu(bm), bmKey(bm))"
          @keydown.enter="$emit('bookmark-navigate', bm)"
          @keydown.space.prevent="$emit('bookmark-navigate', bm)">
          <div class="conn-badge conn-badge--bookmark">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span class="conn-item__name">{{ bm.label }}</span>
          <button class="conn-item__more" :class="{ 'is-open': menuFor === bmKey(bm) }" aria-label="More actions" aria-haspopup="menu"
            @click.stop="openMenuAt($event.currentTarget, bookmarkMenu(bm), bmKey(bm))">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
          </button>
        </div>
      </section>

    </div>

    <!-- Footer -->
    <div class="sidebar__footer">
      <div v-if="authEnabled && username" class="sidebar__user" :title="username">
        <div class="sidebar__avatar">{{ username.charAt(0).toUpperCase() }}</div>
        <span class="sidebar__user-name">{{ username }}</span>
        <button class="tb-icon" @click="$emit('logout')" title="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
      <div class="sidebar__footer-row">
        <button class="nav-item" :class="{ 'is-active': activeView === 'settings' }" @click="$emit('navigate', 'settings')">
          <span class="nav-item__icon" v-html="ICONS.settings"></span>
          <span class="nav-item__label">Settings</span>
        </button>
        <button class="tb-icon" @click="toggleTheme" :title="isLight ? 'Switch to dark mode' : 'Switch to light mode'">
          <svg v-if="isLight" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </button>
      </div>
    </div>
   </div>

    <!-- Drag to resize; double-click to reset -->
    <div class="sidebar__resizer" title="Drag to resize" @pointerdown="startResize" @dblclick="resetWidth"></div>

    <ContextMenu :open="!!menuFor" :x="menuPos.x" :y="menuPos.y" :items="menuItems" @close="menuFor = null" />
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import SkeletonLoader from '../ui/SkeletonLoader.vue'
import ProviderIcon   from '../ui/ProviderIcon.vue'
import ContextMenu    from '../ui/ContextMenu.vue'
import { useTheme }     from '../../composables/useTheme.js'
import { usePins }      from '../../composables/usePins.js'
import { useBookmarks } from '../../composables/useBookmarks.js'
import { useSidebar }   from '../../composables/useSidebar.js'

const PROV_SHORT = { gcp: 'GCS', aws: 'S3', huawei: 'OBS', alibaba: 'OSS', azure: 'Azure', gdrive: 'Drive' }

const svg = body => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
const ICONS = {
  home:     svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
}

const props = defineProps({
  connections:    { type: Array,   default: () => [] },
  loading:        { type: Boolean, default: false },
  activeConn:     { type: Object,  default: null },
  activePrefix:   { type: String,  default: '' },
  activeView:     { type: String,  default: '' },
  username:       { type: String,  default: '' },
  authEnabled:    { type: Boolean, default: true },
})

const emit = defineEmits(['new-connection', 'select', 'edit', 'delete', 'bookmark-navigate', 'logout', 'navigate'])

const { isLight, toggleTheme }          = useTheme()
const { isPinned, togglePin }           = usePins()
const { bookmarks, removeBookmark }     = useBookmarks()

const primaryNav = [
  { view: 'home', label: 'Home', icon: ICONS.home },
]

const query           = ref('')
const filterProviders = ref(new Set())

const { hidden, width, resizing, setWidth, resetWidth } = useSidebar()

// ── Row menus (⋯ button or right-click) ──────────────────────────
const MENU_ICONS = {
  pin:    svg('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>'),
  unpin:  svg('<path d="M12 17v5"/><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/>'),
  edit:   svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  trash:  svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  remove: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
}

const menuFor   = ref(null)   // key of the row whose menu is open
const menuPos   = ref({ x: 0, y: 0 })
const menuItems = ref([])

const keyOf = c  => `conn:${c.provider}:${c.id}`
const bmKey = bm => `bm:${bm.provider}:${bm.id}:${bm.prefix}`

function connMenu(c) {
  const pinned = isPinned(c.provider, c.id)
  return [
    { label: pinned ? 'Unpin' : 'Pin to top', icon: pinned ? MENU_ICONS.unpin : MENU_ICONS.pin, action: () => togglePin(c.provider, c.id) },
    { label: 'Edit connection', icon: MENU_ICONS.edit, action: () => emit('edit', c) },
    { separator: true },
    { label: 'Delete connection', icon: MENU_ICONS.trash, danger: true, action: () => emit('delete', c.provider, c.id) },
  ]
}
function bookmarkMenu(bm) {
  return [
    { label: 'Remove from favorites', icon: MENU_ICONS.remove, action: () => removeBookmark(bm.provider, bm.id, bm.prefix) },
  ]
}

function showMenu(items, key, x, y) {
  if (menuFor.value === key) { menuFor.value = null; return }
  menuItems.value = items
  menuPos.value = { x, y }
  menuFor.value = key
}
// Anchored under the ⋯ button, right-aligned to it
function openMenuAt(btn, items, key) {
  const r = btn.getBoundingClientRect()
  showMenu(items, key, r.right - 200, r.bottom + 4)
}
function openMenuAtPoint(e, items, key) {
  menuFor.value = null
  showMenu(items, key, e.clientX, e.clientY)
}

function startResize(e) {
  if (e.button !== 0) return
  e.preventDefault()
  const startX = e.clientX
  const startW = width.value
  resizing.value = true
  const move = ev => setWidth(startW + ev.clientX - startX)
  const stop = () => {
    resizing.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
}

const availableProviders = computed(() => {
  const seen = new Set()
  for (const c of props.connections) seen.add(c.provider)
  return [...seen]
})

function toggleFilter(prov) {
  const next = new Set(filterProviders.value)
  next.has(prov) ? next.delete(prov) : next.add(prov)
  filterProviders.value = next
}

const filtered = computed(() => {
  let list = props.connections
  if (filterProviders.value.size > 0)
    list = list.filter(c => filterProviders.value.has(c.provider))
  const q = query.value.toLowerCase().trim()
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || c.bucket.toLowerCase().includes(q))
  return [...list].sort((a, b) => {
    const pa = isPinned(a.provider, a.id) ? 0 : 1
    const pb = isPinned(b.provider, b.id) ? 0 : 1
    return pa - pb
  })
})
</script>
