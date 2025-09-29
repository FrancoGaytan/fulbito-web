<!-- src/views/LoginPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()
const email = ref('')
const password = ref('')

async function submit() {
  await auth.login({ email: email.value, password: password.value })
  router.replace('/')
}
</script>

<template>
  <div class="min-h-[60vh] grid place-items-center">
    <form @submit.prevent="submit" class="w-full max-w-sm bg-white p-6 rounded-xl shadow border space-y-3">
      <h1 class="text-xl font-semibold">Ingresar</h1>
      <input v-model="email" type="email" placeholder="Email" class="w-full border rounded px-3 py-2" required />
      <input v-model="password" type="password" placeholder="Contraseña" class="w-full border rounded px-3 py-2" required />
      <button :disabled="auth.loading" class="w-full px-4 py-2 rounded bg-black text-white">
        {{ auth.loading ? 'Ingresando…' : 'Entrar' }}
      </button>
      <p v-if="auth.error" class="text-red-600 text-sm">{{ auth.error }}</p>
      <p class="text-xs text-center text-gray-600">¿No tenés cuenta? <router-link to="/register" class="underline">Registrate</router-link></p>
    </form>
  </div>
</template>
