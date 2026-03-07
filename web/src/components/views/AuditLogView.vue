<template>
  <div class="view-panel">
    <div class="view-panel__hd">
      <div>
        <h2 class="view-panel__title">Audit Log</h2>
        <p class="view-panel__sub">Track all platform activity</p>
      </div>
      <button class="icon-btn" @click="refresh" title="Refresh">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>

    <div v-if="loading && !entries.length" class="view-panel__loading">
      <div class="base-btn__spinner" style="width:16px;height:16px"></div>
      Loading audit log...
    </div>

    <div v-else-if="error" class="status-notice status-notice--error" style="margin:16px 24px">
      {{ error }}
    </div>

    <div v-else class="view-panel__body">
      <div v-if="!entries.length" class="empty-state" style="padding:40px 16px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        No audit entries yet
      </div>

      <table v-else class="file-table">
        <thead>
          <tr>
            <th style="width:60px">Action</th>
            <th>Provider</th>
            <th>Object</th>
            <th>Details</th>
            <th>IP</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in entries" :key="e.id">
            <td>
              <span class="audit-action" :class="`audit-action--${e.action}`">{{ e.action }}</span>
            </td>
            <td>
              <span v-if="e.provider" class="base-badge" :class="`base-badge--${e.provider}`">{{ e.provider.toUpperCase() }}</span>
              <span v-else class="file-type">—</span>
            </td>
            <td>
              <span class="file-name" style="font-size:11px" v-if="e.object">{{ e.object }}</span>
              <span v-else class="file-type">—</span>
            </td>
            <td class="file-type" style="max-width:200px;overflow:hidden;text-overflow:ellipsis">{{ e.details || '—' }}</td>
            <td class="file-type" style="font-family:var(--mono);font-size:11px">{{ e.ip || '—' }}</td>
            <td class="file-date">{{ formatDate(e.created_at) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="entries.length >= 100" class="view-panel__footer">
        <button class="base-btn base-btn--ghost" @click="handleLoadMore" :disabled="loadingMore">
          <div v-if="loadingMore" class="base-btn__spinner"></div>
          Load more
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAudit } from '../../composables/useAudit.js'

const { entries, loading, error, fetchAudit, loadMore } = useAudit()
const loadingMore = ref(false)

onMounted(() => fetchAudit())

function refresh() {
  fetchAudit()
}

async function handleLoadMore() {
  loadingMore.value = true
  await loadMore(entries.value.length)
  loadingMore.value = false
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
