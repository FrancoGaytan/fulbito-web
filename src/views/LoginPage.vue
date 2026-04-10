<!-- src/views/LoginPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { t } from '@/localizations'
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
  <div class="min-h-[85vh] flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm mx-auto space-y-8">
      <!-- Logo -->
      <div class="text-center space-y-1">
        <div class="text-3xl font-extrabold text-accent tracking-tight select-none">⚽ FulbITo</div>
      </div>

      <!-- Heading -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold italic text-white">{{ t('login.title') }}</h1>
        <p class="text-sm text-gray-400">{{ t('login.subtitle') }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="submit" class="space-y-4">
        <!-- Email -->
        <div class="space-y-1.5">
          <label class="section-label">EMAIL</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <input v-model="email" type="email" placeholder="nombre@ejemplo.com" class="input-dark pl-10" required />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="section-label">CONTRASEÑA</label>
            <RouterLink to="/forgot" class="text-[11px] text-accent hover:text-accent-light transition">{{ t('login.forgot') }}</RouterLink>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
            <input v-model="password" type="password" placeholder="••••••••" class="input-dark pl-10" required />
          </div>
        </div>

        <!-- Submit -->
        <button :disabled="auth.loading" class="btn-accent">
          {{ auth.loading ? t('login.actionLoading') : t('login.action') }}
        </button>

        <p v-if="auth.error" class="text-red-400 text-xs text-center">{{ auth.error }}</p>
      </form>

      <!-- Register CTA -->
      <p class="text-sm text-center text-gray-500">{{ t('login.noAccount') }}
        <router-link to="/register" class="text-accent font-semibold hover:text-accent-light transition">{{ t('login.registerCta') }}</router-link>
      </p>
    </div>
  </div>
</template>
