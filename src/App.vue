<script setup lang="ts">
import { useAuth } from "./stores/auth";
import { useRouter } from "vue-router";
const auth = useAuth();
const router = useRouter();

function logout() {
  auth.logout();
  router.replace("/login");
}
</script>
<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="border-b bg-white">
      <div class="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
        <span class="text-xl font-bold">Fulbito</span>
        <nav class="ml-auto flex gap-4 text-sm">
          <RouterLink v-if="auth.isAuthenticated" to="/">Partidos</RouterLink>
          <RouterLink v-if="auth.isAuthenticated" to="/groups"
            >Grupos</RouterLink
          >
          <RouterLink v-if="auth.isAuthenticated" to="/players"
            >Jugadores</RouterLink
          >
          <RouterLink v-else to="/login">Login</RouterLink>
          <button v-if="auth.isAuthenticated" class="underline" @click="logout">
            Salir
          </button>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
