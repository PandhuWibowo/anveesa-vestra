<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="open" class="modal-backdrop" @mousedown.self="$emit('update:open', false)">
        <div ref="modalRef" class="modal" :class="{ 'modal--wide': wide }" role="dialog" :aria-label="title"
          @keydown.escape.stop="$emit('update:open', false)">
          <div class="modal-hd">
            <div class="modal-hd__text">
              <h3 class="modal-title">{{ title }}</h3>
              <p v-if="description || $slots.description" class="modal-desc">
                <slot name="description">{{ description }}</slot>
              </p>
            </div>
            <button class="modal-close" @click="$emit('update:open', false)" aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-bd">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-ft">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const modalRef = ref(null)

const props = defineProps({
  open:        { type: Boolean, required: true },
  title:       { type: String,  default: '' },
  description: { type: String,  default: '' },
  wide:        { type: Boolean, default: false },
})
defineEmits(['update:open'])

// Start in the first field so you can type straight away; otherwise focus the
// primary action (never the close button).
watch(() => props.open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  const el = modalRef.value
  if (!el) return
  const field = el.querySelector('.modal-bd input:not([readonly]), .modal-bd textarea, .modal-bd select')
  const button = el.querySelector('.modal-ft .base-btn--primary') ?? el.querySelector('.modal-ft button')
  ;(field ?? button)?.focus()
})
</script>
