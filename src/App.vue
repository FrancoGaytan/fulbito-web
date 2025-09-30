<script setup lang="ts">
import { useAuth } from "./stores/auth";
import { useRouter } from "vue-router";
import { ref, onMounted, provide } from 'vue';
const auth = useAuth();
const router = useRouter();
const mobileNavOpen = ref(false);

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

function toggleMobileNav() {
  mobileNavOpen.value = !mobileNavOpen.value;
}

onMounted(() => {
  router.afterEach(() => { mobileNavOpen.value = false; });
});

function linkBaseClasses(active: boolean) {
  return [
    "relative inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500",
    active
      ? "bg-indigo-600 text-white shadow hover:bg-indigo-500"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  ].join(" ");
}
</script>
<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="border-b bg-white relative z-50">
      <div class="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <span class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 select-none">FulbITo</span>
        <!-- Desktop nav -->
        <nav v-if="auth.isAuthenticated" class="hidden sm:flex ml-auto items-center gap-2">
          <RouterLink to="/" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive)" :aria-current="isActive ? 'page' : undefined">Partidos</span></RouterLink>
          <RouterLink to="/groups" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive)">Grupos</span></RouterLink>
          <RouterLink to="/players" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive)">Jugadores</span></RouterLink>
          <button @click="logout" class="ml-4 inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition">Salir</button>
        </nav>
        <nav v-else class="hidden sm:flex ml-auto items-center gap-2">
          <RouterLink to="/login" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive)">Login</span></RouterLink>
        </nav>
        <!-- Mobile toggle -->
        <button @click="toggleMobileNav" class="sm:hidden ml-auto inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" :aria-expanded="mobileNavOpen" :aria-label="mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'">
          <svg v-if="!mobileNavOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <!-- Mobile menu panel -->
      <transition name="fade">
        <div v-if="mobileNavOpen" class="sm:hidden border-t bg-white shadow-inner">
          <div class="px-4 py-3 flex flex-col gap-2">
            <template v-if="auth.isAuthenticated">
              <RouterLink to="/" class="w-full" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive) + ' w-full justify-start'">Partidos</span></RouterLink>
              <RouterLink to="/groups" class="w-full" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive) + ' w-full justify-start'">Grupos</span></RouterLink>
              <RouterLink to="/players" class="w-full" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive) + ' w-full justify-start'">Jugadores</span></RouterLink>
              <button @click="logout" class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500">Salir</button>
            </template>
            <template v-else>
              <RouterLink to="/login" class="w-full" v-slot="{ isActive }"><span :class="linkBaseClasses(isActive) + ' w-full justify-start'">Login</span></RouterLink>
            </template>
          </div>
        </div>
      </transition>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <RouterView />
    </main>
    <!-- Toasts -->
    <TransitionGroup name="toast" tag="div" class="fixed inset-0 flex flex-col items-end gap-2 p-4 pointer-events-none z-[1000]">
      <div v-for="t in toasts" :key="t.id" role="status" class="w-full sm:w-80 pointer-events-auto select-none overflow-hidden rounded-lg shadow ring-1 ring-black/10 flex items-start gap-3 px-4 py-3 text-sm"
        :class="[
          t.type === 'success' && 'bg-green-50 text-green-700',
          t.type === 'error' && 'bg-red-50 text-red-700',
          t.type === 'info' && 'bg-white text-gray-700'
        ]">
        <div class="flex-1 leading-snug">{{ t.message }}</div>
        <button @click="removeToast(t.id)" class="mt-0.5 inline-flex items-center justify-center rounded-md p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-from { opacity: 0; transform: translateY(6px) scale(.96); }
.toast-enter-active { transition: all .22s cubic-bezier(.4,0,.2,1); }
.toast-leave-to { opacity: 0; transform: translateY(6px) scale(.96); }
.toast-leave-active { transition: all .18s ease-in; }
</style>
