<template>
  <!-- Rendered on <body> so containers with overflow:hidden can't clip it -->
  <Teleport to="body">
    <transition name="menu-pop">
      <div v-if="open" ref="el" class="menu menu--floating" role="menu"
        :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
        @click.stop @contextmenu.prevent>
        <template v-for="(item, i) in items" :key="i">
          <div v-if="item.separator" class="menu__sep"></div>
          <button v-else class="menu__item" :class="{ 'menu__item--danger': item.danger }" role="menuitem"
            @click="choose(item)">
            <span v-if="item.icon" class="menu__icon" v-html="item.icon"></span>
            {{ item.label }}
          </button>
        </template>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'

// items: [{ label, icon?, danger?, action }] or { separator: true }
const props = defineProps({
  open:  { type: Boolean, default: false },
  x:     { type: Number,  default: 0 },
  y:     { type: Number,  default: 0 },
  items: { type: Array,   default: () => [] },
})
const emit = defineEmits(['close'])

const el  = ref(null)
const pos = ref({ x: 0, y: 0 })

function choose(item) {
  emit('close')
  item.action?.()
}

function onKey(e) { if (e.key === 'Escape') emit('close') }
function onOutside(e) { if (el.value && !el.value.contains(e.target)) emit('close') }
function close() { emit('close') }

function listen(on) {
  const fn = on ? 'addEventListener' : 'removeEventListener'
  document[fn]('mousedown', onOutside, true)
  document[fn]('keydown', onKey)
  window[fn]('blur', close)
  window[fn]('resize', close)
  document[fn]('scroll', close, true)
}

watch(() => props.open, async open => {
  listen(false)
  if (!open) return
  pos.value = { x: props.x, y: props.y }
  await nextTick()
  // Keep the menu inside the window
  const r = el.value?.getBoundingClientRect()
  if (r) {
    pos.value = {
      x: Math.max(8, Math.min(props.x, window.innerWidth - r.width - 8)),
      y: Math.max(8, Math.min(props.y, window.innerHeight - r.height - 8)),
    }
  }
  listen(true)
})

onUnmounted(() => listen(false))
</script>
