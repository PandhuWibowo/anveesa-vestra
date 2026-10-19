<template>
  <transition name="notice-fade">
    <div v-if="message" :class="['status-notice', `status-notice--${type}`]" role="alert">
      <span class="status-notice__icon" v-html="icons[type]"></span>
      <span class="status-notice__text">{{ message }}</span>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // 'info' | 'success' | 'error'
})

const svg = d => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const icons = {
  info:    svg('<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
  success: svg('<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9.5"/>'),
  error:   svg('<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
}
</script>
