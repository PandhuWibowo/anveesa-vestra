<template>
  <!-- Two-factor setup opens as its own page, with a way back -->
  <div v-if="page === '2fa'" class="settings-sub">
    <button class="settings-back" @click="$emit('update:page', 'general')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Settings
    </button>
    <TwoFactorView />
  </div>

  <div v-else class="view-panel">
    <div class="view-panel__hd">
      <div>
        <h2 class="view-panel__title">Settings</h2>
      </div>
    </div>
    <div class="view-panel__body">
      <div class="settings-card">
        <div class="settings-row">
          <div>
            <div class="settings-row__title">Appearance</div>
            <div class="settings-row__sub">Choose a theme, or follow your system setting.</div>
          </div>
          <div class="segmented">
            <button v-for="opt in themeOptions" :key="opt.id"
              class="segmented__btn" :class="{ 'is-active': preference === opt.id }"
              @click="setTheme(opt.id)">{{ opt.label }}</button>
          </div>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__title">Back up connections</div>
            <div class="settings-row__sub">Save all storage connections to a file, or restore them from one.</div>
          </div>
          <div class="settings-row__actions">
            <BaseButton variant="ghost" @click="$emit('import-connections')">Import…</BaseButton>
            <BaseButton variant="ghost" @click="$emit('export-connections')">Export</BaseButton>
          </div>
        </div>
        <div v-if="authEnabled" class="settings-row">
          <div>
            <div class="settings-row__title">Two-factor authentication</div>
            <div class="settings-row__sub">Require a code from your authenticator app when signing in.</div>
          </div>
          <BaseButton variant="ghost" @click="$emit('update:page', '2fa')">Manage</BaseButton>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__title">Help</div>
            <div class="settings-row__sub">Guides for connecting providers and using the file browser.</div>
          </div>
          <BaseButton variant="ghost" @click="$emit('docs')">Open documentation</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseButton    from '../ui/BaseButton.vue'
import TwoFactorView from './TwoFactorView.vue'
import { useTheme }  from '../../composables/useTheme.js'

defineProps({
  page:        { type: String,  default: 'general' }, // 'general' | '2fa'
  authEnabled: { type: Boolean, default: false },
})
defineEmits(['update:page', 'export-connections', 'import-connections', 'docs'])

const { preference, setTheme } = useTheme()

const themeOptions = [
  { id: 'light',  label: 'Light' },
  { id: 'dark',   label: 'Dark' },
  { id: 'system', label: 'System' },
]
</script>
