<script setup lang="ts">
/**
 * Simple fullscreen centered loader overlay.
 * @prop label Optional custom text (defaults to localized fallback outside component)
 */
defineProps<{ label?: string }>();
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center px-4 z-[900]">
    <div class="flex flex-col items-center gap-4 text-center">
      <div class="relative w-14 h-14" aria-hidden="true">
        <span class="absolute inset-0 rounded-full border-4 border-indigo-200"></span>
        <span class="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></span>
      </div>
      <p class="text-sm font-medium text-gray-700">{{ label || 'Cargando…' }}</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin 0.9s linear infinite; }
</style>