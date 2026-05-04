<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
    <h1 class="text-3xl font-bold mb-2">Fulbito</h1>
    <p class="text-gray-400 mb-8 text-sm">Seleccioná o creá un Space para continuar</p>

    <!-- Lista de spaces -->
    <div v-if="spacesStore.spaces.length" class="w-full max-w-sm space-y-3 mb-6">
      <button
        v-for="space in spacesStore.spaces"
        :key="space._id"
        class="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition text-left"
        @click="select(space._id)"
      >
        <div>
          <p class="font-semibold">{{ space.name }}</p>
          <p class="text-xs text-gray-400 capitalize">{{ space.role ?? 'member' }} · {{ space.memberCount ?? '?' }} miembros</p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="space.isAdmin && space.inviteCode"
            class="font-mono text-sm tracking-widest text-yellow-400 select-all"
            @click.stop="copyCode(space.inviteCode!)"
            title="Copiar código"
          >{{ space.inviteCode }}</span>
          <span class="text-green-400 text-xl">→</span>
        </div>
      </button>
    </div>

    <p v-else-if="!spacesStore.loading" class="text-gray-400 text-sm mb-6">Aún no pertenecés a ningún space.</p>

    <!-- Acciones -->
    <div class="w-full max-w-sm space-y-3">
      <!-- Unirse con código -->
      <div v-if="!showJoin && !showCreate">
        <button class="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 font-semibold" @click="showJoin = true">
          Unirse con código
        </button>
      </div>
      <form v-if="showJoin" class="space-y-2" @submit.prevent="join">
        <input
          v-model="inviteCode"
          type="text"
          placeholder="Código de invitación (ej: AB3XYZ)"
          maxlength="6"
          class="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" :disabled="joining" class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl py-3 font-semibold">
          {{ joining ? 'Uniéndose...' : 'Unirse' }}
        </button>
        <button type="button" class="w-full text-gray-400 text-sm" @click="showJoin = false">Cancelar</button>
      </form>

      <!-- Crear space -->
      <div v-if="!showJoin && !showCreate">
        <button class="w-full bg-gray-700 hover:bg-gray-600 rounded-xl py-3 font-semibold" @click="showCreate = true">
          Crear nuevo Space
        </button>
      </div>
      <form v-if="showCreate" class="space-y-2" @submit.prevent="create">
        <input
          v-model="newName"
          type="text"
          placeholder="Nombre del space"
          class="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" :disabled="creating" class="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl py-3 font-semibold">
          {{ creating ? 'Creando...' : 'Crear Space' }}
        </button>
        <button type="button" class="w-full text-gray-400 text-sm" @click="showCreate = false">Cancelar</button>
      </form>
    </div>

    <p v-if="error" class="mt-4 text-red-400 text-sm text-center">{{ error }}</p>

    <!-- Cerrar sesión -->
    <button class="mt-10 text-gray-500 text-xs hover:text-gray-300" @click="logout">Cerrar sesión</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSpaces } from '../stores/spaces';
import { useAuth } from '../stores/auth';

const router = useRouter();
const spacesStore = useSpaces();
const authStore = useAuth();

const showJoin = ref(false);
const showCreate = ref(false);
const inviteCode = ref('');
const newName = ref('');
const joining = ref(false);
const creating = ref(false);
const error = ref('');

onMounted(() => spacesStore.fetchSpaces());

function select(id: string) {
  spacesStore.setActiveSpace(id);
  router.push('/');
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    // silencioso — el usuario puede copiar manualmente
  }
}

async function join() {
  if (!inviteCode.value.trim()) return;
  joining.value = true;
  error.value = '';
  try {
    const space = await spacesStore.joinSpace(inviteCode.value.trim());
    router.push('/');
  } catch (e: any) {
    error.value = e?.message ?? 'Código inválido';
  } finally {
    joining.value = false;
  }
}

async function create() {
  if (!newName.value.trim()) return;
  creating.value = true;
  error.value = '';
  try {
    await spacesStore.createSpace(newName.value.trim());
    router.push('/');
  } catch (e: any) {
    error.value = e?.message ?? 'Error creando space';
  } finally {
    creating.value = false;
  }
}

function logout() {
  authStore.logout();
  spacesStore.setActiveSpace(null);
  router.push('/login');
}
</script>
