<script setup lang="ts">
import { computed } from 'vue';
import { useGroups } from '@/stores/groups';
import { useGroupContext } from '@/stores/groupContext';
import { t } from '@/localizations';

const groups = useGroups();
const ctx = useGroupContext();

const value = computed({
  get: () => ctx.activeGroupId,
  set: (v: string) => ctx.setActive(v)
});
</script>

<template>
  <div class="flex items-center gap-2" v-if="groups.items.length">
  <label class="text-xs uppercase tracking-wide text-gray-500">{{ t('groupSelector.label') }}</label>
    <select v-model="value" class="text-sm border rounded px-2 py-1 bg-white">
      <option value="">{{ t('groupSelector.all') }}</option>
      <option v-for="g in groups.items" :key="g._id" :value="g._id">{{ g.name }}</option>
    </select>
  </div>
</template>

<style scoped>
</style>
