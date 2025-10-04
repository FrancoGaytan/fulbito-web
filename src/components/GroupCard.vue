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
  <div class="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
    <div class="flex items-center gap-3">
      <h2 class="font-medium text-lg">{{ group.name }}</h2>
      <div class="flex items-center gap-2">
        <span v-if="group.isOwner" class="text-[10px] uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{{ t('groups.owner') }}</span>
        <span v-else-if="group.isMember" class="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded">{{ t('groups.member') }}</span>
      </div>
      <span class="ml-auto text-sm text-gray-500">{{ memberIds.length }} {{ t('groups.playersSuffix') }}</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <span v-for="pid in memberIds" :key="pid" class="text-xs rounded-full bg-gray-100 border px-2 py-0.5">
        {{ nameById[pid] || pid }}
      </span>
    </div>

    <div class="flex gap-2 justify-between">
      <button
        class="px-3 py-1.5 rounded text-white disabled:opacity-50"
        :class="canEdit ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'"
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
        class="ml-2 px-3 py-1 text-s rounded bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 transition-colors"
        :title="t('groups.deleteTitle')"
      >
        {{ t('groups.delete') }}
      </button>
    </div>

    <!-- Panel inline -->
    <div v-if="isOpen" class="mt-3 border-t pt-3 space-y-3">
      <div class="flex items-center gap-2">
        <input
          :value="search"
          @input="onSearch"
          type="text"
          :placeholder="t('groups.searchPlayer')"
          class="border rounded px-3 py-2 w-full"
        />
        <button class="px-2 py-2 text-xs border rounded leading-none" @click="onSelectAll">
          {{ t('groups.selectAll') }}
        </button>
      </div>

      <div class="max-h-64 overflow-auto grid md:grid-cols-2 gap-2">
        <label v-for="p in filtered" :key="p._id" class="flex items-center gap-2 border rounded px-3 py-2">
          <input type="checkbox" :value="p._id" :checked="selected.includes(p._id as UUID)" @change="(e:any)=>{
            const next = new Set(selected);
            if(e.target.checked) next.add(p._id as UUID); else next.delete(p._id as UUID);
            emit('update:selected', Array.from(next) as UUID[]);
          }" />
          <span>{{ p.name }}</span>
        </label>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          :disabled="selected.length === 0"
          @click="onAddSelected"
        >
          {{ t('groups.addCount') }} {{ selected.length }}
        </button>
        <button class="px-3 py-2 border rounded" @click="closePanel">
          {{ t('groups.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
