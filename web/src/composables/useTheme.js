import { ref, computed } from 'vue'

// Shared across the app: 'light' | 'dark' | 'system' (follow the OS).
const preference = ref(readPreference())
const systemDark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
    systemDark.value = e.matches
    apply()
})

function readPreference() {
    try {
        const saved = localStorage.getItem('theme')
        if (saved === 'light' || saved === 'dark') return saved
    } catch { }
    return 'system'
}

const isLight = computed(() =>
    preference.value === 'system' ? !systemDark.value : preference.value === 'light')

function apply() {
    if (isLight.value) document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
}

function setTheme(mode) {
    preference.value = mode
    try {
        if (mode === 'system') localStorage.removeItem('theme')
        else localStorage.setItem('theme', mode)
    } catch { }
    apply()
}

function toggleTheme() {
    setTheme(isLight.value ? 'dark' : 'light')
}

apply()

export function useTheme() {
    return { isLight, preference, setTheme, toggleTheme }
}
