<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const mod = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl'

const GROUPS = [
  { title: 'Navigation', rows: [
    [['J'], 'Next item'], [['K'], 'Previous item'],
    [['Enter'], 'Open folder or preview file'], [['Backspace'], 'Go up one folder'],
    [['/'], 'Search this folder'],
  ]},
  { title: 'Files', rows: [
    [['Space'], 'Preview'], [['F'], 'Full-screen preview'], [['D'], 'Download'],
    [['Delete'], 'Delete'], [['R'], 'Refresh'],
  ]},
  { title: 'App', rows: [
    [['N'], 'Add storage'], [[mod, '\\'], 'Show or hide sidebar'],
    [['Esc'], 'Close panel or dialog'], [['?'], 'Show these shortcuts'],
  ]},
]

function handleEscape(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onUnmounted(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="open" class="shortcut-overlay modal-backdrop" @click.self="emit('close')">
        <div class="shortcut-modal modal modal--wide" role="dialog" aria-label="Keyboard shortcuts">
          <div class="modal-hd">
            <div class="modal-hd__text">
              <h3 class="modal-title">Keyboard shortcuts</h3>
            </div>
            <button class="shortcut-modal__close modal-close" @click="emit('close')" aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="shortcut-grid">
            <section v-for="g in GROUPS" :key="g.title" class="shortcut-group">
              <h4>{{ g.title }}</h4>
              <div v-for="([keys, label], i) in g.rows" :key="i" class="shortcut-row">
                <span>{{ label }}</span>
                <span class="shortcut-keys"><kbd v-for="k in keys" :key="k">{{ k }}</kbd></span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 28px;
  padding: 10px 22px 22px;
}
.shortcut-group h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  margin: 12px 0 4px;
}
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 32px;
  font-size: 13px;
  color: var(--text);
}
.shortcut-keys { display: flex; gap: 4px; }
kbd {
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--border-2);
  border-bottom-width: 2px;
  background: var(--surface-2);
  font: 500 11.5px var(--font);
  color: var(--text-2);
}
</style>
