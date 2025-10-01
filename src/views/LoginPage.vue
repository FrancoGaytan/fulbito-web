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
  <div class="min-h-[70vh] flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
      <!-- Illustration / Hero copy -->
      <div class="hidden md:flex flex-col gap-4">
        <div class="relative group">
          <img src="/src/assets/images/it-football.svg" alt="Fulbito Devs" class="w-full rounded-2xl shadow-lg ring-1 ring-black/10" />
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition" />
        </div>
        <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600">{{ t('login.heroTitle') }}</h2>
        <p class="text-sm text-gray-600 leading-relaxed max-w-sm">{{ t('login.heroCopy') }}</p>
      </div>
      <!-- Auth form -->
      <form @submit.prevent="submit" class="w-full max-w-sm mx-auto bg-white p-6 rounded-xl shadow border space-y-4">
        <div class="space-y-1">
          <h1 class="text-xl font-semibold tracking-tight">{{ t('login.title') }}</h1>
          <p class="text-xs text-gray-500">{{ t('login.subtitle') }}</p>
        </div>
        <div class="space-y-3">
          <div>
            <input v-model="email" type="email" :placeholder="t('login.emailPlaceholder')" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div class="space-y-1">
            <input v-model="password" type="password" :placeholder="t('login.passwordPlaceholder')" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <div class="flex justify-end">
              <RouterLink to="/forgot" class="text-[11px] text-indigo-600 hover:underline">{{ t('login.forgot') }}</RouterLink>
            </div>
          </div>
          <button :disabled="auth.loading" class="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {{ auth.loading ? t('login.actionLoading') : t('login.action') }}
          </button>
          <p v-if="auth.error" class="text-red-600 text-xs">{{ auth.error }}</p>
        </div>
        <p class="text-xs text-center text-gray-600">{{ t('login.noAccount') }} <router-link to="/register" class="underline font-medium">{{ t('login.registerCta') }}</router-link></p>
      </form>
    </div>
  </div>
</template>
