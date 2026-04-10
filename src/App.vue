<script setup lang="ts">
import { useAuth } from "./stores/auth";
import { useRouter, useRoute } from "vue-router";
import { ref, computed, onMounted, provide } from 'vue';
import BottomNav from './components/BottomNav.vue';

const auth = useAuth();
const router = useRouter();
const route = useRoute();

const AUTH_ROUTES = ['login', 'register', 'forgot'];
const isAuthPage = computed(() => AUTH_ROUTES.includes(route.name as string));
const showChrome = computed(() => auth.isAuthenticated && !isAuthPage.value);

// --- Simple global toast system ---
interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  timeout: number;
}

const toasts = ref<ToastItem[]>([]);

function pushToast(message: string, type: ToastItem['type'] = 'info', timeout = 4000) {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, message, type, timeout });

  if (timeout > 0) {
    setTimeout(() => removeToast(id), timeout);
  }
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id);
}

provide('pushToast', pushToast);

function logout() {
  auth.logout();
  router.replace("/login");
}

onMounted(() => {
  router.afterEach(() => {});
});
</script>

<template>
  <div class="min-h-screen bg-dark-900 text-white">
    <!-- Header -->
    <header v-if="showChrome" class="sticky top-0 z-50 bg-dark-800/90 backdrop-blur-lg border-b border-dark-500/30">
      <div class="mx-auto max-w-5xl px-4 py-3 flex items-center">
        <RouterLink to="/" class="flex items-center gap-2">
          <span class="text-xl font-extrabold tracking-tight text-accent select-none">⚽ FulbITo</span>
        </RouterLink>

        <!-- Mobile logout -->
        <button @click="logout"
          class="sm:hidden ml-auto p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Cerrar sesión">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        </button>

        <!-- Desktop nav -->
        <nav class="hidden sm:flex ml-auto items-center gap-1">
          <RouterLink to="/" v-slot="{ isActive }">
            <span :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all', isActive ? 'bg-accent/15 text-accent' : 'text-gray-400 hover:text-white hover:bg-dark-600']">Partidos</span>
          </RouterLink>
          <RouterLink to="/players" v-slot="{ isActive }">
            <span :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all', isActive ? 'bg-accent/15 text-accent' : 'text-gray-400 hover:text-white hover:bg-dark-600']">Jugadores</span>
          </RouterLink>
          <RouterLink to="/groups" v-slot="{ isActive }">
            <span :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all', isActive ? 'bg-accent/15 text-accent' : 'text-gray-400 hover:text-white hover:bg-dark-600']">Grupos</span>
          </RouterLink>
          <button @click="logout"
            class="ml-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">Salir</button>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="mx-auto max-w-5xl px-4 py-6 sm:pb-6" :style="showChrome ? { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' } : {}">
      <RouterView />
    </main>

    <!-- Mobile bottom nav (only when authed, not on auth pages) -->
    <BottomNav v-if="showChrome" />

    <!-- Toasts -->
    <TransitionGroup name="toast" tag="div"
      class="fixed top-4 right-4 flex flex-col items-end gap-2 pointer-events-none z-[1000]">
      <div v-for="t in toasts" :key="t.id" role="status"
        class="w-full sm:w-80 pointer-events-auto select-none overflow-hidden rounded-xl shadow-lg ring-1 ring-white/5 flex items-start gap-3 px-4 py-3 text-sm backdrop-blur-lg"
        :class="[
          t.type === 'success' && 'bg-accent/20 text-accent border border-accent/30',
          t.type === 'error' && 'bg-red-500/20 text-red-400 border border-red-500/30',
          t.type === 'info' && 'bg-dark-700 text-gray-200 border border-dark-500/40'
        ]">
        <div class="flex-1 leading-snug">{{ t.message }}</div>
        <button @click="removeToast(t.id)"
          class="mt-0.5 inline-flex items-center justify-center rounded-md p-1 text-gray-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(.96);
}

.toast-enter-active {
  transition: all .22s cubic-bezier(.4, 0, .2, 1);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.96);
}

.toast-leave-active {
  transition: all .18s ease-in;
}
</style>
