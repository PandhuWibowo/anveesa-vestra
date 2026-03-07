<template>
  <div class="auth-screen">
    <div class="auth-card">
      <div class="auth-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 6 6 0 0 0-11.8-1A4 4 0 0 0 3 15z"/>
        </svg>
        <div>
          <div class="auth-brand__name"><span class="auth-brand__anvesa">Anveesa</span> Vestra</div>
          <div class="auth-brand__sub">Cloud storage manager</div>
        </div>
      </div>

      <h2 class="auth-title">{{ setupRequired ? 'Create Admin Account' : 'Sign In' }}</h2>
      <p class="auth-sub">
        {{ setupRequired
          ? 'Set up your admin account to get started.'
          : 'Enter your credentials to continue.' }}
      </p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="auth-field">
          <label class="auth-label" for="auth-user">Username</label>
          <input
            id="auth-user"
            class="auth-input"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="admin"
            required
            :minlength="setupRequired ? 3 : 1"
          />
        </div>
        <div class="auth-field">
          <label class="auth-label" for="auth-pass">Password</label>
          <input
            id="auth-pass"
            class="auth-input"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
            :minlength="setupRequired ? 8 : 1"
          />
        </div>
        <div v-if="setupRequired" class="auth-field">
          <label class="auth-label" for="auth-pass2">Confirm Password</label>
          <input
            id="auth-pass2"
            class="auth-input"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            minlength="8"
          />
        </div>

        <p v-if="authError" class="auth-error">{{ authError }}</p>
        <p v-if="localError" class="auth-error">{{ localError }}</p>

        <button class="auth-submit" type="submit" :disabled="authLoading">
          {{ authLoading ? 'Please wait…' : (setupRequired ? 'Create Account' : 'Sign In') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth.js'

const { setupRequired, authLoading, authError, register, login } = useAuth()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref('')

async function handleSubmit() {
  localError.value = ''
  if (setupRequired.value) {
    if (password.value !== confirmPassword.value) {
      localError.value = 'Passwords do not match'
      return
    }
    if (password.value.length < 8) {
      localError.value = 'Password must be at least 8 characters'
      return
    }
    await register(username.value, password.value)
  } else {
    await login(username.value, password.value)
  }
}
</script>

<style scoped>
.auth-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px 32px 32px;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  color: var(--text);
}

.auth-brand__name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.auth-brand__anvesa {
  color: var(--accent);
}

.auth-brand__sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 1px;
}

.auth-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
}

.auth-sub {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 24px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.auth-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
}

.auth-input {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.auth-input:focus {
  border-color: var(--accent);
}

.auth-input::placeholder {
  color: var(--muted);
  opacity: 0.6;
}

.auth-error {
  margin: 0;
  font-size: 12px;
  color: var(--danger, #e55);
  background: rgba(220, 50, 50, 0.08);
  border-radius: 6px;
  padding: 8px 10px;
}

.auth-submit {
  padding: 10px 0;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.auth-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.auth-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
