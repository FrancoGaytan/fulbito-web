<script setup lang="ts">
import { t } from '@/localizations';
import type { Match, UUID } from '@/types';

/** Summary view of a match with open / delete actions and highlight state. */
const props = defineProps<{ match: Match; highlight?: boolean; selectedGroup?: string | UUID | ''; canDelete?: boolean }>();
/** Emits: remove(id) → parent deletes match */
const emit = defineEmits<{ (e: 'remove', id: UUID): void }>();

/** Ask parent to remove the match if allowed */
function remove() { if (props.canDelete) emit('remove', props.match._id as UUID); }

/** Resolve display date choosing scheduledAt fallbacking to legacy fields. */
function viewDate(m: Match) {
  const d: string | undefined = m.scheduledAt ?? (m as any).date ?? (m as any).createdAt;
  return d ? new Date(d).toLocaleString() : t('matches.noDate');
}
</script>

<template>
  <div :class="[
      'p-4 rounded-xl border shadow-sm transition-colors duration-700',
      match.status === 'finalized' ? 'bg-gray-200' : 'bg-white',
      highlight && 'bg-green-100 ring-1 ring-green-300'
    ]">
    <div class="flex items-center justify-between">
      <div class="text-sm opacity-60">{{ viewDate(match) }}</div>
      <div class="flex items-center gap-2">
        <button
          v-if="canDelete && match.canEdit"
          type="button"
          @click="remove"
          class="inline-block px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 transition-colors"
        >
          {{ t('matches.delete') }}
        </button>
        <router-link
          :to="`/match/${match._id}?group=${selectedGroup || ''}`"
          class="inline-block px-3 py-1.5 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 transition-colors"
        >
          {{ t('matches.open') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
