<script setup lang="ts">
import { ref, inject } from 'vue'
import { t } from '@/localizations'
import { useRouter } from 'vue-router'
import { register as apiRegister } from '../lib/auth.service'
import { useAuth } from '../stores/auth'
import { localStorageKeys } from '../utils/localStorageKeys'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const debug = ref<any | null>(null)
const autoRedirect = ref(true)
const auth = useAuth()
// Global toast (provided in App.vue)
const pushToast = inject<(msg: string, type?: 'info' | 'success' | 'error', timeout?: number) => void>('pushToast')

async function submit() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = null
  try {
    const response = await apiRegister({ email: email.value, password: password.value })
    debug.value = response // incluye endpoint usado
    const token = response?.token
    if (token) {
      localStorage.setItem(localStorageKeys.token, token)
      auth.token = token
      if (autoRedirect.value) router.replace('/')
    } else {
  error.value = t('register.missingToken')
    }
  } catch (e: any) {
    console.error('Register error', e)
    // Detectar duplicado (backend 409 o mensaje mongo E11000)
    const status = e?.status || e?.code || e?.response?.status
    const msg: string = e?.message || ''
    if (status === 409 || /E11000|duplicate/i.test(msg)) {
  const friendly = t('register.duplicateEmail')
      error.value = friendly
      pushToast?.(friendly, 'error')
    } else {
  error.value = msg || t('register.error')
      if (msg) pushToast?.(msg, 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[85vh] flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm mx-auto space-y-8">
      <!-- Logo -->
      <div class="text-center">
        <div class="text-3xl font-extrabold text-accent tracking-tight select-none">⚽ FulbITo</div>
      </div>

      <!-- Heading -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold italic text-white">{{ t('register.title') }}</h1>
        <p class="text-sm text-gray-400">{{ t('register.subtitle') }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="submit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="section-label">EMAIL</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <input v-model="email" type="email" :placeholder="t('register.emailPlaceholder')" class="input-dark pl-10" required />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="section-label">CONTRASEÑA</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
            <input v-model="password" type="password" placeholder="••••••••" class="input-dark pl-10" required />
          </div>
        </div>

        <button :disabled="loading" class="btn-accent">
          {{ loading ? t('register.actionLoading') : t('register.action') }}
        </button>

        <p v-if="error" class="text-red-400 text-xs text-center">{{ error }}</p>
      </form>

      <details v-if="debug" class="text-xs bg-dark-700 border border-dark-500/40 rounded-xl p-3 text-gray-400">
        <summary class="cursor-pointer">Debug response</summary>
        <pre class="whitespace-pre-wrap break-all mt-2">{{ debug }}</pre>
      </details>

      <p class="text-sm text-center text-gray-500">{{ t('register.haveAccount') }}
        <router-link to="/login" class="text-accent font-semibold hover:text-accent-light transition">{{ t('register.loginCta') }}</router-link>
      </p>
    </div>
  </div>
</template>