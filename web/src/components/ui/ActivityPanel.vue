<template>
  <transition name="slide-panel">
    <div v-if="open" class="activity-panel">
      <div class="activity-hd">
        <span class="activity-hd__title">Activity</span>
        <div style="display:flex;gap:6px;align-items:center">
          <button v-if="activities.length" class="activity-clear" @click="clear" title="Clear log">Clear</button>
          <button class="preview-close" @click="$emit('close')">×</button>
        </div>
      </div>
      <div class="activity-body">
        <div v-if="!activities.length" class="activity-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3;margin-bottom:6px">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>No activity yet.</p>
        </div>
        <div v-for="a in activities" :key="a.id" class="activity-item">
          <div class="activity-dot" :class="`activity-dot--${a.type}`"></div>
          <div class="activity-content">
            <span class="activity-msg">{{ a.message }}</span>
            <span class="activity-time">{{ formatTime(a.time) }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useActivity } from '../../composables/useActivity.js'

defineProps({ open: Boolean })
defineEmits(['close'])

const { activities, clear } = useActivity()

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>
