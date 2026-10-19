<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="pending" class="modal-backdrop" @mousedown.self="respond(false)">
        <div class="modal modal--confirm" role="alertdialog" :aria-label="pending.title"
          @keydown.escape.stop="respond(false)">
          <div class="modal-hd">
            <div class="modal-hd__text">
              <h3 class="modal-title">{{ pending.title }}</h3>
              <p class="modal-desc">{{ pending.message }}</p>
            </div>
          </div>
          <div class="modal-ft">
            <button class="base-btn base-btn--ghost" @click="respond(false)">Cancel</button>
            <button ref="confirmBtn" class="base-btn" :class="pending.danger ? 'base-btn--danger-solid' : 'base-btn--primary'" @click="respond(true)">
              {{ pending.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useConfirm } from '../../composables/useConfirm.js'
const { pending, respond } = useConfirm()

// Focus the safe choice for destructive actions, the action otherwise
const confirmBtn = ref(null)
watch(pending, async p => {
  if (!p) return
  await nextTick()
  const modal = confirmBtn.value?.closest('.modal')
  ;(p.danger ? modal?.querySelector('.base-btn--ghost') : confirmBtn.value)?.focus()
})
</script>
