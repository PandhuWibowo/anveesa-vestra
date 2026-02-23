<template>
  <aside class="sidebar">
    <!-- Brand -->
    <div class="sidebar__brand">
      <div class="brand-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 6 6 0 0 0-11.8-1A4 4 0 0 0 3 15z"/>
        </svg>
      </div>
      <div>
        <div class="brand-name"><span class="brand-anvesa">Anveesa</span> Vestra</div>
        <div class="brand-sub">Cloud storage manager</div>
      </div>
    </div>

    <!-- Body -->
    <div class="sidebar__body">
      <!-- New connection -->
      <button class="btn-new-conn" @click="$emit('new-connection')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Connection
      </button>

      <!-- Search -->
      <div v-if="connections.length > 0" class="sidebar-search">
        <svg class="sidebar-search__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="sidebar-search__input"
          v-model="query"
          placeholder="Filter connections…"
        />
      </div>

      <!-- Provider filter chips -->
      <div class="prov-filter" v-if="availableProviders.length > 1">
        <button
          v-for="prov in availableProviders"
          :key="prov"
          class="prov-chip"
          :class="[`prov-chip--${prov}`, { 'prov-chip--active': filterProviders.has(prov) }]"
          @click="toggleFilter(prov)"
        >
          <ProviderIcon :provider="prov" :size="10" />
          {{ PROV_SHORT[prov] ?? prov }}
        </button>
      </div>

      <!-- Skeleton while loading -->
      <SkeletonLoader v-if="loading" :count="3" height="42px" />

      <template v-else>
        <!-- Section label -->
        <div v-if="filtered.length" class="section-label">
          {{ filtered.some(c => isPinned(c.provider, c.id)) ? 'Pinned · All' : 'Connections' }}
        </div>

        <!-- Empty -->
        <div v-if="!filtered.length && !connections.length" class="sidebar-empty">
          No connections yet.<br>Add your first bucket above.
        </div>

        <!-- Items -->
        <div
          v-for="c in filtered"
          :key="c.provider + '-' + c.id"
          class="conn-item"
          :class="{ 'is-active': activeConn?.id === c.id && activeConn?.provider === c.provider }"
          @click="$emit('select', c)"
        >
          <div class="conn-badge" :class="`conn-badge--${c.provider}`">
            <ProviderIcon :provider="c.provider" :size="11" />
          </div>
          <div class="conn-item__body">
            <div class="conn-item__name">{{ c.name }}</div>
            <div class="conn-item__bucket">{{ c.bucket }}</div>
          </div>
          <!-- Pin -->
          <button
            class="conn-item__del"
            :class="{ 'is-pinned': isPinned(c.provider, c.id) }"
            @click.stop="togglePin(c.provider, c.id)"
            :title="isPinned(c.provider, c.id) ? 'Unpin' : 'Pin to top'"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" :fill="isPinned(c.provider, c.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
          <!-- Edit -->
          <button
            class="conn-item__del"
            @click.stop="$emit('edit', c)"
            title="Edit connection"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <!-- Delete -->
          <button
            class="conn-item__del"
            @click.stop="$emit('delete', c.provider, c.id)"
            title="Delete connection"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </template>

      <!-- Bookmarks section -->
      <template v-if="bookmarks.length">
        <div class="section-label section-label--bookmarks">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="opacity:.7">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Bookmarks
        </div>
        <div
          v-for="bm in bookmarks"
          :key="bm.provider + bm.id + bm.prefix"
          class="bookmark-item"
          :class="{ 'is-active': activeConn?.id === bm.id && activeConn?.provider === bm.provider && activePrefix === bm.prefix }"
          @click="$emit('bookmark-navigate', bm)"
          :title="`${bm.connName} / ${bm.prefix || bm.bucket}`"
        >
          <div class="conn-badge conn-badge--xs" :class="`conn-badge--${bm.provider}`">
            <ProviderIcon :provider="bm.provider" :size="9" />
          </div>
          <div class="bookmark-item__body">
            <div class="bookmark-item__label">{{ bm.label }}</div>
            <div class="bookmark-item__conn">{{ bm.connName }}</div>
          </div>
          <button
            class="conn-item__del"
            @click.stop="removeBookmark(bm.provider, bm.id, bm.prefix)"
            title="Remove bookmark"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </template>
    </div>

    <!-- Bottom actions -->
    <div class="sidebar__bottom">
      <!-- Split view toggle -->
      <button class="theme-btn" :class="{ 'is-active': splitActive }" @click="$emit('split')" title="Toggle split (dual-pane) view">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>
        </svg>
        Split view
      </button>

      <!-- Activity log -->
      <button class="theme-btn" :class="{ 'is-active': activityActive }" @click="$emit('activity')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Activity
      </button>

      <!-- Docs -->
      <button class="theme-btn" :class="{ 'is-active': docsActive }" @click="$emit('docs')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        Docs
      </button>

      <!-- Theme toggle -->
      <button class="theme-btn" @click="toggleTheme">
        <svg v-if="isLight" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {{ isLight ? 'Light mode' : 'Dark mode' }}
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import SkeletonLoader from '../ui/SkeletonLoader.vue'
import ProviderIcon   from '../ui/ProviderIcon.vue'
import { useTheme }     from '../../composables/useTheme.js'
import { usePins }      from '../../composables/usePins.js'
import { useBookmarks } from '../../composables/useBookmarks.js'

const PROV_SHORT = { gcp: 'GCS', aws: 'S3', huawei: 'OBS', alibaba: 'OSS', azure: 'Azure' }

const props = defineProps({
  connections:    { type: Array,   default: () => [] },
  loading:        { type: Boolean, default: false },
  activeConn:     { type: Object,  default: null },
  activePrefix:   { type: String,  default: '' },
  docsActive:     { type: Boolean, default: false },
  activityActive: { type: Boolean, default: false },
  splitActive:    { type: Boolean, default: false },
})

defineEmits(['new-connection', 'select', 'edit', 'delete', 'docs', 'activity', 'split', 'bookmark-navigate'])

const { isLight, toggleTheme }          = useTheme()
const { isPinned, togglePin }           = usePins()
const { bookmarks, removeBookmark }     = useBookmarks()

const query           = ref('')
const filterProviders = ref(new Set())

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
