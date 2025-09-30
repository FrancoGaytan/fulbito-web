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
  <div class="min-h-[70vh] flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
      <div class="hidden md:flex flex-col gap-4">
        <div class="relative group">
          <img src="/src/assets/images/it-football.svg" alt="Fulbito Devs" class="w-full rounded-2xl shadow-lg ring-1 ring-black/10" />
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition" />
        </div>
        <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600">Sumate al equipo.</h2>
        <p class="text-sm text-gray-600 leading-relaxed max-w-sm">
          Creá tu cuenta, reclamá tu jugador y empezá a sumar minutos y rating en cada partido.
        </p>
      </div>
      <form @submit.prevent="submit" class="w-full max-w-sm mx-auto bg-white p-6 rounded-xl shadow border space-y-4">
        <div class="space-y-1">
          <h1 class="text-xl font-semibold tracking-tight">Crear cuenta</h1>
          <p class="text-xs text-gray-500">Configura tu acceso para participar de los partidos.</p>
        </div>
        <div class="space-y-3">
          <div>
            <input v-model="email" type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <input v-model="password" type="password" placeholder="Contraseña" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div class="flex items-center gap-2 text-xs select-none">
            <input id="redir" type="checkbox" v-model="autoRedirect" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label for="redir">Redirigir automáticamente</label>
          </div>
          <button :disabled="loading" class="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {{ loading ? 'Creando…' : 'Registrarme' }}
          </button>
          <p v-if="error" class="text-red-600 text-xs">{{ error }}</p>
        </div>
        <details v-if="debug" class="text-xs bg-gray-50 border rounded p-2">
          <summary class="cursor-pointer">Debug response</summary>
          <pre class="whitespace-pre-wrap break-all">{{ debug }}</pre>
        </details>
        <p class="text-xs text-center text-gray-600">¿Ya tenés cuenta? <router-link to="/login" class="underline font-medium">Ingresá</router-link></p>
      </form>
    </div>
  </div>
</template>