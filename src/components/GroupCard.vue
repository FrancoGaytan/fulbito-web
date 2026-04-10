<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@/localizations';
import type { UUID } from '@/types';

/** Slim player representation used only for listing / selection */
interface PlayerLite { _id: string; name: string }

/**
 * GroupCard displays a group summary + expandable panel to add players.
 * Parent owns the data arrays; emits pure intent events.
 */
const props = defineProps<{ group: any; isOpen: boolean; memberIds: string[]; nameById: Record<string, string>; filtered: PlayerLite[]; selected: UUID[]; search: string }>();

/** Emitted events (see parent handlers for side-effects) */
const emit = defineEmits<{ (
  e: 'open', id: UUID
): void; (
  e: 'close'
): void; (
  e: 'update:search', value: string
): void; (
  e: 'update:selected', value: UUID[]
): void; (
  e: 'add-selected'
): void; (
  e: 'remove', id: UUID
): void; (
  e: 'select-all'
): void }>();

/** Whether current user can mutate this group */
const canEdit = computed(() => !!props.group?.canEdit);

/** Toggle add-player panel respecting permissions */
function togglePanel() {
  if (!canEdit.value) return;
  if (props.isOpen) emit('close'); else emit('open', props.group._id as UUID);
}
/** Emit search string changes */
function onSearch(e: Event) { emit('update:search', (e.target as HTMLInputElement).value); }
function onSelectAll() { emit('select-all'); }
function onAddSelected() { emit('add-selected'); }
function closePanel() { emit('close'); }
/** Ask parent to remove this group */
function removeGroup() { if (canEdit.value) emit('remove', props.group._id as UUID); }
</script>

<template>
  <div class="card p-4 space-y-3">
    <div class="flex items-center gap-3">
      <h2 class="font-semibold text-white text-lg">{{ group.name }}</h2>
      <div class="flex items-center gap-2">
        <span v-if="group.isOwner" class="badge bg-accent/20 text-accent">{{ t('groups.owner') }}</span>
        <span v-else-if="group.isMember" class="badge-green">{{ t('groups.member') }}</span>
      </div>
      <span class="ml-auto text-sm text-gray-500">{{ memberIds.length }} {{ t('groups.playersSuffix') }}</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <span v-for="pid in memberIds" :key="pid" class="text-xs rounded-full bg-dark-600 border border-dark-500/40 px-2.5 py-0.5 text-gray-300">
        {{ nameById[pid] || pid }}
      </span>
    </div>

    <div class="flex gap-2 justify-between">
      <button
        class="btn-outline"
        :class="canEdit ? '' : 'opacity-50 cursor-not-allowed'"
        :disabled="!canEdit"
        @click="togglePanel"
        :title="canEdit ? t('groups.addPlayers') : t('groups.addPlayersTitle')"
      >
        {{ t('groups.addPlayers') }}
      </button>
      <button
        v-if="canEdit"
        type="button"
        @click="removeGroup"
        class="px-3 py-1.5 text-sm rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
        :title="t('groups.deleteTitle')"
      >
        {{ t('groups.delete') }}
      </button>
    </div>

    <!-- Panel inline -->
    <div v-if="isOpen" class="mt-3 border-t border-dark-500/30 pt-3 space-y-3">
      <div class="flex items-center gap-2">
        <input
          :value="search"
          @input="onSearch"
          type="text"
          :placeholder="t('groups.searchPlayer')"
          class="input-dark"
        />
        <button class="btn-outline shrink-0" @click="onSelectAll">
          {{ t('groups.selectAll') }}
        </button>
      </div>

      <div class="max-h-64 overflow-auto grid md:grid-cols-2 gap-2 pr-1">
        <label v-for="p in filtered" :key="p._id"
          :class="[
            'flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all border',
            selected.includes(p._id as UUID)
              ? 'bg-accent/10 border-accent/30'
              : 'border-dark-500/30 hover:border-dark-500/60'
          ]"
        >
          <input type="checkbox" :value="p._id" :checked="selected.includes(p._id as UUID)" @change="(e:any)=>{
            const next = new Set(selected);
            if(e.target.checked) next.add(p._id as UUID); else next.delete(p._id as UUID);
            emit('update:selected', Array.from(next) as UUID[]);
          }" class="sr-only" />
          <div :class="[
            'w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0',
            selected.includes(p._id as UUID) ? 'border-accent bg-accent' : 'border-dark-500'
          ]">
            <svg v-if="selected.includes(p._id as UUID)" xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <span class="text-sm text-gray-300">{{ p.name }}</span>
        </label>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="btn-accent !w-auto px-6"
          :disabled="selected.length === 0"
          @click="onAddSelected"
        >
          {{ t('groups.addCount') }} {{ selected.length }}
        </button>
        <button class="btn-outline" @click="closePanel">
          {{ t('groups.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
