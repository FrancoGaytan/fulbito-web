<template>
  <div class="min-h-screen bg-gray-950 text-white pb-24 pt-6 px-4 max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-1">{{ space?.name ?? 'Space' }}</h1>
    <p class="text-gray-400 text-sm mb-6">{{ space?.memberCount ?? '?' }} miembros · Tu rol: <span class="capitalize">{{ space?.role ?? 'member' }}</span></p>

    <!-- Código de invitación (solo admins) -->
    <div v-if="space?.isAdmin" class="bg-gray-800 rounded-2xl p-5 mb-5">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Código de invitación</h2>
      <div class="flex items-center gap-3">
        <span class="text-3xl font-mono tracking-widest font-bold text-white select-all">{{ displayCode }}</span>
        <button
          class="ml-auto text-blue-400 hover:text-blue-300 text-sm font-semibold"
          @click="copyCode"
        >{{ copied ? '¡Copiado!' : 'Copiar' }}</button>
      </div>
      <p class="text-xs text-gray-500 mt-2">Compartí este código para que otros puedan unirse al space.</p>
      <button
        class="mt-4 text-xs text-gray-500 hover:text-red-400 underline"
        :disabled="regenerating"
        @click="regenerate"
      >{{ regenerating ? 'Regenerando...' : 'Regenerar código' }}</button>
    </div>

    <!-- Cambiar de space -->
    <div class="bg-gray-800 rounded-2xl p-5 mb-5">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Mis spaces</h2>
      <div class="space-y-2">
        <button
          v-for="s in spacesStore.spaces"
          :key="s._id"
          class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition"
          :class="s._id === spacesStore.activeSpaceId ? 'bg-green-700/40 text-green-300' : 'bg-gray-700 hover:bg-gray-600 text-white'"
          @click="switchSpace(s._id)"
        >
          <span>{{ s.name }}</span>
          <span v-if="s._id === spacesStore.activeSpaceId" class="text-xs text-green-400">Activo</span>
        </button>
      </div>
      <button
        class="mt-3 w-full bg-gray-700 hover:bg-gray-600 rounded-xl py-2 text-sm font-semibold"
        @click="router.push('/spaces')"
      >Gestionar spaces</button>
    </div>

    <p v-if="error" class="text-red-400 text-sm text-center">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSpaces } from '../stores/spaces';
import { spacesService } from '../lib/spaces.service';

const router = useRouter();
const spacesStore = useSpaces();

const space = computed(() => spacesStore.activeSpace);
const displayCode = ref<string>(space.value?.inviteCode ?? '');
const copied = ref(false);
const regenerating = ref(false);
const error = ref('');

// Si el código no vino en la lista, cargarlo del endpoint de detalle
if (space.value?.isAdmin && !space.value?.inviteCode) {
  spacesService.get(space.value._id).then(s => {
    displayCode.value = s.inviteCode ?? '';
    // Actualizar también en el store para que quede cacheado
    const idx = spacesStore.spaces.findIndex(x => x._id === s._id);
    if (idx >= 0) spacesStore.spaces[idx] = { ...spacesStore.spaces[idx], ...s };
  }).catch(() => {});
} else if (space.value?.inviteCode) {
  displayCode.value = space.value.inviteCode;
}

async function copyCode() {
  if (!displayCode.value) return;
  try {
    await navigator.clipboard.writeText(displayCode.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    error.value = 'No se pudo copiar al portapapeles';
  }
}

async function regenerate() {
  if (!space.value?._id) return;
  regenerating.value = true;
  error.value = '';
  try {
    const { inviteCode } = await spacesService.regenerateCode(space.value._id);
    displayCode.value = inviteCode;
    const idx = spacesStore.spaces.findIndex(x => x._id === space.value!._id);
    if (idx >= 0) spacesStore.spaces[idx] = { ...spacesStore.spaces[idx], inviteCode };
  } catch (e: any) {
    error.value = e?.message ?? 'Error regenerando código';
  } finally {
    regenerating.value = false;
  }
}

function switchSpace(id: string) {
  spacesStore.setActiveSpace(id);
  router.push('/');
}
</script>
