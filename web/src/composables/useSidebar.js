import { ref, watch } from 'vue'

// Sidebar visibility and width, shared by the shell, the toolbar toggle and
// the sidebar's resize handle.
export const SIDEBAR_MIN = 200
export const SIDEBAR_MAX = 360
export const SIDEBAR_DEFAULT = 244

function read(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
function write(key, value) {
    try { localStorage.setItem(key, String(value)) } catch { }
}
const clamp = w => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w))

const hidden   = ref(read('vestra-sidebar-hidden', 'false') === 'true')
const width    = ref(clamp(Number(read('vestra-sidebar-width', SIDEBAR_DEFAULT)) || SIDEBAR_DEFAULT))
const resizing = ref(false)

watch(hidden, v => write('vestra-sidebar-hidden', v))
watch(width,  v => write('vestra-sidebar-width', v))

export function useSidebar() {
    return {
        hidden,
        width,
        resizing,
        toggle:     () => { hidden.value = !hidden.value },
        setWidth:   w  => { width.value = clamp(Math.round(w)) },
        resetWidth: () => { width.value = SIDEBAR_DEFAULT },
    }
}
