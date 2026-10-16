<template>
  <div class="view-panel">
    <div class="view-panel__hd">
      <div>
        <h2 class="view-panel__title">Home</h2>
        <p class="view-panel__sub">
          {{ connections.length ? 'Pick a storage to browse its files.' : 'Connect your first cloud storage to get started.' }}
        </p>
      </div>
      <BaseButton v-if="connections.length" variant="primary" @click="$emit('new-connection')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add storage
      </BaseButton>
    </div>

    <div class="view-panel__body">
      <!-- Empty: one clear next step -->
      <div v-if="!loading && !connections.length" class="home-empty">
        <div class="welcome__icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 6 6 0 0 0-11.8-1A4 4 0 0 0 3 15z"/></svg>
        </div>
        <p class="welcome__title">No storage connected</p>
        <p class="welcome__sub">Vestra works with Google Cloud Storage, Amazon S3, Azure, Alibaba OSS, Huawei OBS and Google Drive.</p>
        <BaseButton variant="primary" style="margin-top:10px" @click="$emit('new-connection')">Add storage</BaseButton>
      </div>

      <template v-else>
        <h3 class="home-section">Storage</h3>
        <div class="home-grid">
          <button v-for="c in connections" :key="c.provider + '-' + c.id" class="home-card" @click="$emit('select', c)">
            <div class="conn-badge home-card__icon" :class="`conn-badge--${c.provider}`">
              <ProviderIcon :provider="c.provider" :size="18" />
            </div>
            <div class="home-card__name">{{ c.name }}</div>
            <div class="home-card__meta">{{ PROVIDER_NAMES[c.provider] ?? c.provider }} · {{ c.bucket }}</div>
          </button>
          <button class="home-card home-card--add" @click="$emit('new-connection')">
            <div class="home-card__icon home-card__icon--add">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div class="home-card__name">Add storage</div>
            <div class="home-card__meta">Connect another bucket</div>
          </button>
        </div>

        <template v-if="bookmarks.length">
          <h3 class="home-section">Favorites</h3>
          <div class="home-list">
            <button v-for="bm in bookmarks" :key="bm.provider + bm.id + bm.prefix" class="home-list__item" @click="$emit('bookmark-navigate', bm)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:var(--folder)"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span class="home-list__name">{{ bm.label }}</span>
              <span class="home-list__meta">{{ bm.connName }}</span>
            </button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import BaseButton   from '../ui/BaseButton.vue'
import ProviderIcon from '../ui/ProviderIcon.vue'
import { useBookmarks } from '../../composables/useBookmarks.js'

defineProps({
  connections: { type: Array,   default: () => [] },
  loading:     { type: Boolean, default: false },
})
defineEmits(['select', 'new-connection', 'bookmark-navigate'])

const { bookmarks } = useBookmarks()

const PROVIDER_NAMES = {
  gcp: 'Google Cloud Storage', aws: 'Amazon S3', azure: 'Azure Blob',
  alibaba: 'Alibaba OSS', huawei: 'Huawei OBS', gdrive: 'Google Drive',
}
</script>
