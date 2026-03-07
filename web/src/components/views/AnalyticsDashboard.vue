<template>
  <div class="view-panel">
    <div class="view-panel__hd">
      <div>
        <h2 class="view-panel__title">Dashboard</h2>
        <p class="view-panel__sub">Platform overview and analytics</p>
      </div>
      <button class="icon-btn" @click="fetchAnalytics" title="Refresh">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>

    <div v-if="loading" class="view-panel__loading">
      <div class="base-btn__spinner" style="width:16px;height:16px"></div>
      Loading analytics...
    </div>

    <div v-else-if="error" class="status-notice status-notice--error" style="margin:16px 24px">
      {{ error }}
    </div>

    <div v-else-if="data" class="view-panel__body">
      <!-- Connection counts -->
      <div class="dash-section">
        <h3 class="dash-section__title">Connections</h3>
        <div class="dash-cards">
          <div class="dash-card" v-for="(count, provider) in providerCounts" :key="provider">
            <div class="dash-card__icon" :class="`dash-card__icon--${provider}`">
              <ProviderIcon :provider="provider" :size="14" />
            </div>
            <div class="dash-card__val">{{ count }}</div>
            <div class="dash-card__label">{{ PROV_NAMES[provider] || provider }}</div>
          </div>
          <div class="dash-card dash-card--accent">
            <div class="dash-card__val">{{ data.connections?.total || 0 }}</div>
            <div class="dash-card__label">Total</div>
          </div>
        </div>
      </div>

      <!-- Activity 24h -->
      <div class="dash-section">
        <h3 class="dash-section__title">Activity (24h)</h3>
        <div class="dash-cards">
          <div class="dash-card" v-for="(count, action) in data.activity_24h" :key="action">
            <div class="dash-card__dot" :class="`dash-card__dot--${action}`"></div>
            <div class="dash-card__val">{{ count }}</div>
            <div class="dash-card__label">{{ action }}</div>
          </div>
        </div>
      </div>

      <!-- Jobs -->
      <div class="dash-section">
        <h3 class="dash-section__title">Background Jobs</h3>
        <div class="dash-cards">
          <div class="dash-card" v-for="(count, status) in data.jobs" :key="status">
            <div class="dash-card__dot" :class="`dash-card__dot--${status}`"></div>
            <div class="dash-card__val">{{ count }}</div>
            <div class="dash-card__label">{{ status }}</div>
          </div>
        </div>
      </div>

      <!-- Shared links -->
      <div class="dash-section">
        <h3 class="dash-section__title">Shared Links</h3>
        <div class="dash-cards">
          <div class="dash-card">
            <div class="dash-card__val">{{ data.shared_links?.active || 0 }}</div>
            <div class="dash-card__label">Active links</div>
          </div>
          <div class="dash-card">
            <div class="dash-card__val">{{ data.shared_links?.total_downloads || 0 }}</div>
            <div class="dash-card__label">Total downloads</div>
          </div>
        </div>
      </div>

      <!-- Per-connection details -->
      <div v-if="data.connection_details?.length" class="dash-section">
        <h3 class="dash-section__title">Connection Details</h3>
        <div class="conn-details-table">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Name</th>
                <th>Bucket</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.connection_details" :key="c.provider + '-' + c.id">
                <td><span class="audit-action" :class="`audit-action--${c.provider}`">{{ c.provider }}</span></td>
                <td>{{ c.name }}</td>
                <td>{{ c.bucket }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAnalytics } from '../../composables/useAnalytics.js'
import ProviderIcon from '../ui/ProviderIcon.vue'

const PROV_NAMES = {
  gcp: 'Google Cloud', aws: 'Amazon S3', huawei: 'Huawei OBS',
  alibaba: 'Alibaba OSS', azure: 'Azure Blob', gdrive: 'Google Drive',
}

const { data, loading, error, fetchAnalytics } = useAnalytics()

const providerCounts = computed(() => {
  if (!data.value?.connections) return {}
  const { total, ...providers } = data.value.connections
  return Object.fromEntries(
    Object.entries(providers).filter(([, v]) => typeof v === 'number' && v > 0)
  )
})

onMounted(fetchAnalytics)
</script>
