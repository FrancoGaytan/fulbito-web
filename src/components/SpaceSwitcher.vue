<template>
  <button
    class="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 text-sm transition"
    @click="$router.push('/spaces')"
    :title="activeSpace?.name ?? 'Sin space'"
  >
    <span class="text-green-400">⬡</span>
    <span class="max-w-[120px] truncate font-medium">{{ activeSpace?.name ?? 'Spaces' }}</span>
    <span class="text-gray-400 text-xs">▾</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSpaces } from '../stores/spaces';

const spacesStore = useSpaces();
const activeSpace = computed(() => spacesStore.activeSpace);
</script>
