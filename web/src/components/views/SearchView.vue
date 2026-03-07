<template>
  <div class="view-panel">
    <div class="view-panel__hd">
      <div>
        <h2 class="view-panel__title">Search</h2>
        <p class="view-panel__sub">Search objects across all connections</p>
      </div>
    </div>

    <div class="view-panel__toolbar">
      <!-- Provider selector -->
      <div class="search-ctrl">
        <label class="search-ctrl__label">Provider</label>
        <select v-model="provider" class="base-input" style="max-width:180px">
          <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- Connection filter (optional) -->
      <div class="search-ctrl" v-if="filteredConns.length">
        <label class="search-ctrl__label">Connection</label>
        <select v-model="connectionId" class="base-input" style="max-width:220px">
          <option :value="0">All connections</option>
          <option v-for="c in filteredConns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Search input -->
      <div class="search-ctrl search-ctrl--grow">
        <label class="search-ctrl__label">Prefix / path</label>
        <form @submit.prevent="doSearch" style="display:flex;gap:6px">
          <input
            v-model="query"
            class="base-input"
            placeholder="e.g. images/2024/"
            style="flex:1"
          />
          <button class="base-btn base-btn--primary" :disabled="!query.trim() || searching" type="submit">
            <div v-if="searching" class="base-btn__spinner"></div>
            Search
          </button>
        </form>
      </div>
    </div>

    <!-- Results -->
    <div class="view-panel__body">
      <div v-if="error" class="status-notice status-notice--error" style="margin:0 0 12px">
        {{ error }}
      </div>

      <div v-if="!results.length && !searching && hasSearched" class="empty-state" style="padding:32px 16px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        No results found for "{{ lastQuery }}"
      </div>

      <table v-if="results.length" class="file-table">
        <thead>
          <tr>
            <th>Connection</th>
            <th>Key</th>
            <th>Size</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in results" :key="i" @click="$emit('navigate', r)" class="search-result-row">
            <td>
              <div class="search-conn">
                <div class="conn-badge conn-badge--xs" :class="`conn-badge--${r.provider}`">
                  <ProviderIcon :provider="r.provider" :size="9" />
                </div>
                {{ r.connection_name }}
              </div>
            </td>
            <td><span class="file-name" style="gap:4px"><span class="file-icon">📄</span>{{ r.key }}</span></td>
            <td class="file-size">{{ formatSize(r.size) }}</td>
            <td class="file-date">{{ formatDate(r.updated) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="results.length" class="view-panel__footer">
        {{ results.length }} result{{ results.length === 1 ? '' : 's' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSearch } from '../../composables/useSearch.js'
import ProviderIcon from '../ui/ProviderIcon.vue'

const props = defineProps({
  connections: { type: Array, default: () => [] },
})

defineEmits(['navigate'])

const providers = [
  { id: 'aws', name: 'Amazon S3' },
  { id: 'gcp', name: 'Google Cloud' },
  { id: 'azure', name: 'Azure Blob' },
  { id: 'alibaba', name: 'Alibaba OSS' },
  { id: 'huawei', name: 'Huawei OBS' },
]

const provider = ref('aws')
const connectionId = ref(0)
const query = ref('')
const hasSearched = ref(false)
const lastQuery = ref('')

const filteredConns = computed(() =>
  props.connections.filter(c => c.provider === provider.value)
)

const { results, searching, error, search } = useSearch()

async function doSearch() {
  if (!query.value.trim()) return
  hasSearched.value = true
  lastQuery.value = query.value
  await search(query.value, provider.value, connectionId.value || undefined)
}

function formatSize(bytes) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
