<template>
  <AuthScreen v-if="authChecked && authEnabled && !isAuthenticated" />
  <div v-else-if="authChecked" class="shell"
       :class="{ 'sidebar-hidden': sidebarHidden, 'is-resizing': sidebarResizing }"
       :style="{ '--sidebar-w': sidebarWidth + 'px' }">
    <!-- Sidebar -->
    <AppSidebar
      :connections="connections"
      :loading="loading"
      :activeConn="activeConn"
      :activePrefix="activePrefix"
      :activeView="mode"
      :username="user?.username || ''"
      :authEnabled="authEnabled"
      @new-connection="startNew"
      @select="handleSelect"
      @edit="handleEdit"
      @delete="handleDelete"
      @bookmark-navigate="handleBookmarkNavigate"
      @logout="logout"
      @navigate="handleNavigate"
    />

    <!-- Main area -->
    <main class="main">

      <!-- Home -->
      <HomeView
        v-if="mode === 'home'"
        :connections="connections"
        :loading="loading"
        @select="handleSelect"
        @new-connection="startNew"
        @bookmark-navigate="handleBookmarkNavigate"
      />

      <!-- New connection form -->
      <AddConnectionForm
        v-else-if="mode === 'form'"
        :testing="testing"
        :saving="saving"
        :error="error"
        :notice="notice"
        @test="testConnection"
        @save="handleSave"
      />

      <!-- Edit connection form -->
      <AddConnectionForm
        v-else-if="mode === 'edit' && editingConn"
        :testing="testing"
        :saving="saving"
        :error="error"
        :notice="notice"
        :editConn="editingConn"
        @test="testConnection"
        @save="handleUpdate"
      />

      <!-- Bucket browser (single or split) -->
      <template v-else-if="mode === 'browse' && activeConn">
        <div :class="splitPane ? 'split-pane' : 'solo-pane'">
          <!-- Left / solo pane -->
          <BucketBrowser
            :conn="activeConn"
            :connections="connections"
            :startPrefix="activePrefix"
            :paneId="splitPane ? 'left' : 'solo'"
            :splitActive="splitPane"
            @split="toggleSplit"
            @delete="handleDelete(activeConn.provider, activeConn.id)"
          />

          <!-- Right pane (split mode) -->
          <template v-if="splitPane">
            <div class="split-divider" />
            <div v-if="!rightConn" class="split-placeholder">
              <div class="split-placeholder__inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3;margin-bottom:8px">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>
                </svg>
                <p>Pick a storage from the sidebar</p>
                <p style="font-size:12px;color:var(--muted);margin-top:4px">It opens here, next to the current one. Drag files across to copy them.</p>
              </div>
            </div>
            <BucketBrowser
              v-else
              :conn="rightConn"
              :connections="connections"
              :startPrefix="rightPrefix"
              paneId="right"
              :splitActive="splitPane"
              @split="toggleSplit"
              @delete="handleDelete(rightConn.provider, rightConn.id)"
            />
          </template>
        </div>
      </template>

      <!-- Documentation -->
      <DocsViewer v-else-if="mode === 'docs'" />

      <!-- Settings (everything advanced lives here) -->
      <SettingsView
        v-else-if="mode === 'settings'"
        v-model:page="settingsPage"
        :authEnabled="authEnabled"
        @export-connections="handleExport"
        @import-connections="handleImport"
        @docs="mode = 'docs'"
      />

    </main>

    <!-- Sidebar toggle: pinned in the title-bar row so it never moves. Kept
         last in the markup: Electron applies window drag regions in document
         order, so a no-drag control must come after the drag areas it overlaps. -->
    <div class="window-bar">
      <button class="window-bar__btn" @click="toggleSidebar"
        :title="(sidebarHidden ? 'Show sidebar' : 'Hide sidebar') + (isMac ? ' (⌘\\)' : ' (Ctrl+\\)')"
        :aria-label="sidebarHidden ? 'Show sidebar' : 'Hide sidebar'">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3.5"/><line x1="9.5" y1="4" x2="9.5" y2="20"/>
        </svg>
      </button>
    </div>

    <!-- Global overlays -->
    <ToastContainer />
    <ConfirmModal />
    <ShortcutModal :open="shortcutOpen" @close="shortcutOpen = false" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import AppSidebar        from './components/layout/AppHeader.vue'
import AddConnectionForm from './components/connections/AddConnectionForm.vue'
import BucketBrowser     from './components/connections/BucketBrowser.vue'
import DocsViewer        from './components/docs/DocsViewer.vue'
import BaseButton        from './components/ui/BaseButton.vue'
import ToastContainer    from './components/ui/ToastContainer.vue'
import ConfirmModal      from './components/ui/ConfirmModal.vue'
import AuthScreen        from './components/auth/AuthScreen.vue'
import HomeView          from './components/views/HomeView.vue'
import SettingsView      from './components/views/SettingsView.vue'
import ShortcutModal     from './components/ui/ShortcutModal.vue'
import { useConnections } from './composables/useConnections.js'
import { useAuth }        from './composables/useAuth.js'
import { useToast }       from './composables/useToast.js'
import { useConfirm }     from './composables/useConfirm.js'
import { useConnectionBackup } from './composables/useConnectionBackup.js'
import { useSidebar }     from './composables/useSidebar.js'

const {
  connections, loading, testing, saving, error, notice,
  fetchConnections, testConnection, saveConnection, updateConnection,
  removeConnection, clearMessages,
} = useConnections()

const { token, isAuthenticated, authChecked, authEnabled, checkSetup, fetchMe, logout, user } = useAuth()
const toast = useToast()
const confirm = useConfirm()
const { exportConnections, importConnections } = useConnectionBackup()
const {
  hidden: sidebarHidden, width: sidebarWidth, resizing: sidebarResizing, toggle: toggleSidebar,
} = useSidebar()
const isMac = /Mac/.test(navigator.platform)

const mode        = ref('home') // 'home' | 'form' | 'edit' | 'browse' | 'settings' | 'docs'
const settingsPage = ref('general') // 'general' | '2fa'
const shortcutOpen = ref(false)
const activeConn  = ref(null)
const activePrefix = ref('')
const editingConn = ref(null)

function saveNavState() {
  const state = { mode: mode.value, prefix: activePrefix.value }
  if (activeConn.value) {
    state.connProvider = activeConn.value.provider
    state.connId = activeConn.value.id
  }
  localStorage.setItem('anveesa-nav', JSON.stringify(state))
}

function restoreNavState() {
  try {
    const raw = localStorage.getItem('anveesa-nav')
    if (!raw) return
    const state = JSON.parse(raw)
    const restorable = ['browse', 'docs', 'settings']
    if (!restorable.includes(state.mode)) return
    if (state.mode === 'browse' && state.connProvider != null && state.connId != null) {
      const conn = connections.value.find(
        c => c.provider === state.connProvider && c.id === state.connId
      )
      if (conn) {
        activeConn.value = conn
        activePrefix.value = state.prefix || ''
        mode.value = 'browse'
        return
      }
    }
    if (state.mode !== 'browse') {
      mode.value = state.mode
    }
  } catch { /* ignore corrupt data */ }
}

// ── Split (dual-pane) ──────────────────────────────────────────
const splitPane   = ref(false)
const rightConn   = ref(null)
const rightPrefix = ref('')
// Track which pane receives the next sidebar click in split mode
const nextPane    = ref('left') // 'left' | 'right'

function toggleSplit() {
  splitPane.value = !splitPane.value
  if (!splitPane.value) {
    rightConn.value   = null
    rightPrefix.value = ''
    nextPane.value    = 'left'
  }
}

onMounted(async () => {
  await checkSetup()
  if (authEnabled.value && token.value) {
    await fetchMe()
  }
  if (!authEnabled.value || isAuthenticated.value) {
    await fetchConnections()
    restoreNavState()
  }
  window.addEventListener('keydown', onAppKeyDown)
})
onUnmounted(() => window.removeEventListener('keydown', onAppKeyDown))

watch(isAuthenticated, async (authed) => {
  if (authed) {
    await fetchConnections()
    restoreNavState()
  }
})

watch([mode, activeConn, activePrefix], () => saveNavState())

function onAppKeyDown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
    e.preventDefault()
    toggleSidebar()
    return
  }
  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
  if (e.key === '?' && !inInput && !e.metaKey && !e.ctrlKey) {
    shortcutOpen.value = !shortcutOpen.value
    return
  }
  if ((e.key === 'n' || e.key === 'N') && !inInput && !e.metaKey && !e.ctrlKey) {
    startNew()
  }
}

// ── Navigation ────────────────────────────────────────────────

function handleSelect(conn) {
  if (splitPane.value) {
    if (nextPane.value === 'right') {
      rightConn.value   = conn
      rightPrefix.value = ''
      nextPane.value    = 'left'
    } else {
      activeConn.value   = conn
      activePrefix.value = ''
      nextPane.value     = 'right'
      mode.value         = 'browse'
    }
  } else {
    activeConn.value   = conn
    activePrefix.value = ''
    editingConn.value  = null
    mode.value         = 'browse'
  }
  clearMessages()
}

function startNew() {
  editingConn.value = null
  mode.value        = 'form'
  clearMessages()
}

function handleEdit(conn) {
  editingConn.value = conn
  mode.value        = 'edit'
  clearMessages()
}

// ── Bookmark navigation ───────────────────────────────────────

function handleBookmarkNavigate(bm) {
  const conn = connections.value.find(
    c => c.provider === bm.provider && String(c.id) === String(bm.id)
  )
  if (!conn) return
  if (splitPane.value && nextPane.value === 'right') {
    rightConn.value   = conn
    rightPrefix.value = bm.prefix ?? ''
    nextPane.value    = 'left'
  } else {
    activeConn.value   = conn
    activePrefix.value = bm.prefix ?? ''
    mode.value         = 'browse'
    nextPane.value     = 'right'
  }
  clearMessages()
}

// ── View navigation ──────────────────────────────────────────

function handleNavigate(view) {
  if (view === 'settings') settingsPage.value = 'general'
  mode.value = view
  clearMessages()
}

// ── Connection backup ─────────────────────────────────────────

async function handleExport() {
  try {
    await exportConnections()
    toast.success('Connections exported.')
  } catch {
    toast.error('Export failed.')
  }
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const count = await importConnections(file)
      toast.success(`Imported ${count} ${count === 1 ? 'storage' : 'storages'}.`)
      fetchConnections()
    } catch (err) {
      toast.error('Import failed: ' + err.message)
    }
  }
  input.click()
}

// ── Save / Update ─────────────────────────────────────────────

async function handleSave(provider, form, resolve) {
  const success = await saveConnection(provider, form)
  if (success) {
    const saved = connections.value.find(
      c => c.provider === provider && c.name === form.name
    )
    if (saved) {
      activeConn.value   = saved
      activePrefix.value = ''
      editingConn.value  = null
      mode.value         = 'browse'
    }
    toast.success('Storage added.')
  }
  resolve?.(success)
}

async function handleUpdate(provider, form, resolve, id) {
  const success = await updateConnection(provider, id, form)
  if (success) {
    if (activeConn.value?.id === id && activeConn.value?.provider === provider) {
      const updated = connections.value.find(
        c => c.provider === provider && c.id === id
      )
      if (updated) activeConn.value = updated
    }
    editingConn.value = null
    mode.value        = activeConn.value ? 'browse' : 'home'
    toast.success('Changes saved.')
  }
  resolve?.(success)
}

// ── Delete ────────────────────────────────────────────────────

async function handleDelete(provider, id) {
  const name = connections.value.find(c => c.provider === provider && c.id === id)?.name ?? 'this storage'
  const ok = await confirm.confirm(
    `Vestra will forget ${name} and its saved keys. Files in the bucket aren't touched.`,
    `Remove ${name}?`,
    { confirmLabel: 'Remove' }
  )
  if (!ok) return
  if (activeConn.value?.id === id && activeConn.value?.provider === provider) {
    activeConn.value   = null
    activePrefix.value = ''
    mode.value         = 'home'
  }
  if (rightConn.value?.id === id && rightConn.value?.provider === provider) {
    rightConn.value   = null
    rightPrefix.value = ''
  }
  if (editingConn.value?.id === id && editingConn.value?.provider === provider) {
    editingConn.value = null
    mode.value        = 'home'
  }
  removeConnection(provider, id)
}
</script>
