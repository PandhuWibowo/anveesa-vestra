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

      <h2 class="auth-title">{{ totpChallenge ? 'Two-Factor Auth' : setupRequired ? 'Create Your Account' : 'Sign In' }}</h2>
      <p class="auth-sub">
        {{ totpChallenge
          ? 'Enter the 6-digit code from your authenticator app.'
          : setupRequired
          ? 'Protect your storage manager with a password.'
          : 'Enter your credentials to continue.' }}
      </p>

      <!-- 2FA challenge form -->
      <form v-if="totpChallenge" @submit.prevent="handleTotpChallenge" class="auth-form">
        <div class="auth-field">
          <label class="auth-label" for="auth-totp">Authenticator Code</label>
          <input
            id="auth-totp"
            ref="totpInput"
            class="auth-input"
            v-model="totpCode"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="000000"
            maxlength="6"
            required
          />
        </div>
        <p v-if="localError" class="auth-error">{{ localError }}</p>
        <button class="auth-submit" type="submit" :disabled="authLoading || totpCode.length !== 6">
          {{ authLoading ? 'Verifying…' : 'Verify' }}
        </button>
        <button type="button" class="auth-back" @click="totpChallenge = null; totpCode = ''">← Back to login</button>
      </form>

      <!-- Normal login / register form -->
      <form v-else @submit.prevent="handleSubmit" class="auth-form">
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
import { ref, nextTick } from 'vue'
import { useAuth } from '../../composables/useAuth.js'

const { setupRequired, authLoading, authError, register, login } = useAuth()

const totpChallenge = ref(null) // { user_id }
const totpCode = ref('')
const totpInput = ref(null)

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
    const result = await login(username.value, password.value)
    // Handle 2FA challenge
    if (result?.requires_2fa) {
      totpChallenge.value = { user_id: result.user_id }
      totpCode.value = ''
      localError.value = ''
      await nextTick()
      totpInput.value?.focus()
    }
  }
}

async function handleTotpChallenge() {
  localError.value = ''
  if (!totpChallenge.value || totpCode.value.length !== 6) return
  try {
    const res = await fetch('/api/auth/2fa/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: totpChallenge.value.user_id, code: totpCode.value }),
    })
    if (!res.ok) {
      localError.value = 'Invalid code. Please try again.'
      totpCode.value = ''
      totpInput.value?.focus()
      return
    }
    const data = await res.json()
    // Use the auth composable to set the token
    localStorage.setItem('auth_token', data.token)
    window.location.reload()
  } catch (err) {
    localError.value = 'Verification failed: ' + err.message
  }
}
</script>

<style scoped>
.auth-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(700px 420px at 50% 0%, var(--accent-bg), transparent 70%),
    var(--bg);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 36px 32px 32px;
  box-shadow: var(--shadow-md);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  color: var(--text);
}

.auth-brand > svg {
  width: 40px;
  height: 40px;
  padding: 9px;
  border-radius: 12px;
  background: var(--brand-grad);
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(14, 165, 233, .32);
  flex-shrink: 0;
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

.auth-back {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  text-align: left;
  transition: color .15s;
}
.auth-back:hover { color: var(--text-2); }
</style>
