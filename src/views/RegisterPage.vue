<script setup lang="ts">
import { ref } from 'vue'
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
      error.value = 'Registro sin token en la respuesta'
    }
  } catch (e: any) {
    console.error('Register error', e)
    error.value = e?.message || 'Error de registro'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] grid place-items-center">
    <form @submit.prevent="submit" class="w-full max-w-sm bg-white p-6 rounded-xl shadow border space-y-3">
      <h1 class="text-xl font-semibold">Crear cuenta</h1>
      <input v-model="email" type="email" placeholder="Email" class="w-full border rounded px-3 py-2" required />
      <input v-model="password" type="password" placeholder="Contraseña" class="w-full border rounded px-3 py-2" required />
      <div class="space-y-2">
        <button :disabled="loading" class="w-full px-4 py-2 rounded bg-black text-white">
          {{ loading ? 'Creando…' : 'Registrarme' }}
        </button>
        <label class="flex items-center gap-2 text-xs select-none">
          <input type="checkbox" v-model="autoRedirect" /> Redirigir automáticamente
        </label>
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <details v-if="debug" class="text-xs bg-gray-50 border rounded p-2">
        <summary class="cursor-pointer">Debug response</summary>
        <pre class="whitespace-pre-wrap break-all">{{ debug }}</pre>
      </details>
      <p class="text-xs text-center text-gray-600">¿Ya tenés cuenta? <router-link to="/login" class="underline">Ingresá</router-link></p>
    </form>
  </div>
</template>