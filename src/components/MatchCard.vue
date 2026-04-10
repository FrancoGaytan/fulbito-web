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
  return d
    ? new Date(d).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    : t('matches.noDate');
}
</script>

<template>
  <div :class="[
    'card p-4 transition-all duration-700',
    match.status !== 'finalized' ? 'border border-accent/30 bg-accent/5' : 'opacity-75',
    highlight && 'ring-1 ring-accent/40'
  ]">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-400">{{ viewDate(match) }}</span>
      </div>

      <div class="flex items-center gap-2">
        <button v-if="canDelete && match.canEdit" type="button" @click="remove"
          class="px-3 py-1.5 text-sm font-medium rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
          {{ t('matches.delete') }}
        </button>
        <router-link :to="`/match/${match._id}?group=${selectedGroup || ''}`"
          class="px-4 py-1.5 text-sm font-medium rounded-xl bg-accent/15 text-accent hover:bg-accent/25 transition">
          {{ t('matches.open') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
