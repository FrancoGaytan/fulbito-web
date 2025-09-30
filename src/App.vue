<script setup lang="ts">
import { useAuth } from "./stores/auth";
import { useRouter } from "vue-router";
const auth = useAuth();
const router = useRouter();

function logout() {
  auth.logout();
  router.replace("/login");
}

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
    <header class="border-b bg-white">
      <div class="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
        <span class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 select-none">FulbITo</span>
        <nav v-if="auth.isAuthenticated" class="ml-auto flex items-center gap-2">
          <RouterLink to="/" v-slot="{ isActive }">
            <span :class="linkBaseClasses(isActive)" :aria-current="isActive ? 'page' : undefined">Partidos</span>
          </RouterLink>
          <RouterLink to="/groups" v-slot="{ isActive }">
            <span :class="linkBaseClasses(isActive)">Grupos</span>
          </RouterLink>
          <RouterLink to="/players" v-slot="{ isActive }">
            <span :class="linkBaseClasses(isActive)">Jugadores</span>
          </RouterLink>
          <button @click="logout" class="ml-4 inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition">
            <span>Salir</span>
          </button>
        </nav>
        <nav v-else class="ml-auto flex items-center gap-2">
          <RouterLink to="/login" v-slot="{ isActive }">
            <span :class="linkBaseClasses(isActive)">Login</span>
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
