<template>
  <div class="shell">
    <!-- Sidebar -->
    <AppSidebar
      :connections="connections"
      :loading="loading"
      :activeConn="activeConn"
      :activePrefix="activePrefix"
      :docsActive="mode === 'docs'"
      :activityActive="activityOpen"
      :splitActive="splitPane"
      @new-connection="startNew"
      @select="handleSelect"
      @edit="handleEdit"
      @delete="handleDelete"
      @docs="mode = 'docs'"
      @activity="activityOpen = !activityOpen"
      @split="toggleSplit"
      @bookmark-navigate="handleBookmarkNavigate"
    />

    <!-- Main area -->
    <main class="main">

      <!-- Welcome -->
      <div v-if="mode === 'welcome'" class="welcome">
        <div class="welcome__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 6 6 0 0 0-11.8-1A4 4 0 0 0 3 15z"/>
          </svg>
        </div>
        <p class="welcome__title">
          {{ connections.length ? 'Select a connection' : 'No connections yet' }}
        </p>
        <p class="welcome__sub">
          {{ connections.length
            ? 'Choose a connection from the sidebar to browse its files.'
            : 'Add your first cloud bucket to start browsing files.' }}
        </p>
        <BaseButton v-if="!connections.length" variant="primary" @click="startNew" style="margin-top:8px">
          New Connection
        </BaseButton>
      </div>

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
                <p>Select a connection from the sidebar</p>
                <p style="font-size:11px;color:var(--muted);margin-top:4px">Click any connection to open it in this pane</p>
              </div>
            </div>
            <BucketBrowser
              v-else
              :conn="rightConn"
              :connections="connections"
              :startPrefix="rightPrefix"
              paneId="right"
              @delete="handleDelete(rightConn.provider, rightConn.id)"
            />
          </template>
        </div>
      </template>

      <!-- Documentation -->
      <DocsViewer v-else-if="mode === 'docs'" />

    </main>

    <!-- Activity panel (slides in over right edge) -->
    <ActivityPanel :open="activityOpen" @close="activityOpen = false" />

    <!-- Global overlays -->
    <ToastContainer />
    <ConfirmModal />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar        from './components/layout/AppHeader.vue'
import AddConnectionForm from './components/connections/AddConnectionForm.vue'
import BucketBrowser     from './components/connections/BucketBrowser.vue'
import DocsViewer        from './components/docs/DocsViewer.vue'
import ActivityPanel     from './components/ui/ActivityPanel.vue'
import BaseButton        from './components/ui/BaseButton.vue'
import ToastContainer    from './components/ui/ToastContainer.vue'
import ConfirmModal      from './components/ui/ConfirmModal.vue'
import { useConnections } from './composables/useConnections.js'
import { useToast }       from './composables/useToast.js'

const {
  connections, loading, testing, saving, error, notice,
  fetchConnections, testConnection, saveConnection, updateConnection,
  removeConnection, clearMessages,
} = useConnections()

const toast = useToast()

const mode        = ref('welcome') // 'welcome' | 'form' | 'edit' | 'browse' | 'docs'
const activeConn  = ref(null)
const activePrefix = ref('')
const editingConn = ref(null)

// ── Activity panel ─────────────────────────────────────────────
const activityOpen = ref(false)

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

onMounted(() => {
  fetchConnections()
  window.addEventListener('keydown', onAppKeyDown)
})
onUnmounted(() => window.removeEventListener('keydown', onAppKeyDown))

function onAppKeyDown(e) {
  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
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
    toast.success('Connection saved.')
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
    mode.value        = activeConn.value ? 'browse' : 'welcome'
    toast.success('Connection updated.')
  }
  resolve?.(success)
}

// ── Delete ────────────────────────────────────────────────────

function handleDelete(provider, id) {
  if (activeConn.value?.id === id && activeConn.value?.provider === provider) {
    activeConn.value   = null
    activePrefix.value = ''
    mode.value         = 'welcome'
  }
  if (rightConn.value?.id === id && rightConn.value?.provider === provider) {
    rightConn.value   = null
    rightPrefix.value = ''
  }
  if (editingConn.value?.id === id && editingConn.value?.provider === provider) {
    editingConn.value = null
    mode.value        = 'welcome'
  }
  removeConnection(provider, id)
}
</script>
