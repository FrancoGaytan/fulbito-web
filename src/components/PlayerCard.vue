<script setup lang="ts">
import { t } from '@/localizations';
import { abilityLabels, type AbilityKey } from '@/constants/abilities';
import type { Player, UUID } from '@/types';

/**
 * PlayerCard
 * Presentational + interactive card for a single player.
 * Shows ownership badges, games played, abilities and allows claim / unclaim / remove.
 * Emits high level intent events so parent list manages data mutation.
 */
const props = defineProps<{ 
  player: Player; 
  currentUserId: string; 
  myClaimedPlayerId: string; 
}>();

/**
 * Emitted events:
 * - remove(id): request deletion of player
 * - claim(player): user wants to claim this player profile
 * - unclaim(player): user wants to detach ownership
 * - open(player): card (non‑button) click to open detail view
 */
const emit = defineEmits<{ (
  e: 'remove', id: UUID
): void; (
  e: 'claim', player: Player
): void; (
  e: 'unclaim', player: Player
): void; (
  e: 'open', player: Player
): void }>();

/** Root click handler (ignores inner button clicks) and emits open. */
function onRootClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('button')) return; // ignore clicks on buttons
  emit('open', props.player);
}
/** Request parent to remove this player */
function remove() { emit('remove', props.player._id as UUID); }
/** Request parent to assign current user */
function claim() { emit('claim', props.player); }
/** Request parent to unassign current user */
function unclaim() { emit('unclaim', props.player); }

/** Determine if player belongs to current user */
const isMine = () => props.player.userId && props.player.userId === props.currentUserId;
/** Whether player is claimed by any user */
const isClaimed = () => !!props.player.userId;
</script>

<template>
  <li
    class="relative bg-white p-4 rounded-xl shadow border space-y-2 overflow-hidden cursor-pointer hover:shadow-md transition"
    @click="onRootClick"
  >
    <button
      type="button"
      @click.stop="remove"
      class="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center rounded-md bg-black text-white text-xs hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 transition-colors"
      :title="t('players.deleteTitle')"
    >
      <span class="-mt-px">✕</span>
    </button>
    <div class="font-medium pr-8 flex items-center gap-2">
      <span>{{ player.name }}</span>
      <span v-if="(player.gamesPlayed ?? 0) === 0" class="text-[10px] uppercase tracking-wide bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">{{ t('players.new') }}</span>
      <template v-if="isMine()">
        <span class="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{{ t('players.myProfile') }}</span>
        <button
          type="button"
          @click.stop="unclaim"
          class="text-[10px] uppercase tracking-wide bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-500"
        >{{ t('players.unclaim') }}</button>
      </template>
      <span v-else-if="isClaimed()" class="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ t('players.claimed') }}</span>
      <button
        v-else-if="!myClaimedPlayerId"
        @click.stop="claim"
        class="text-[10px] uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-500"
      >{{ t('players.claim') }}</button>
    </div>
    <div class="text-sm text-gray-500" v-if="player.nickname">@{{ player.nickname }}</div>
    <div v-if="player.gamesPlayed !== undefined" class="text-xs text-gray-500">
      {{ t('players.gamesPlayed') }} <span class="font-medium">{{ player.gamesPlayed }}</span>
    </div>
    <div class="flex flex-wrap gap-1">
      <span
        v-for="([k, v]) in Object.entries(player.abilities || {})"
        :key="k"
        class="text-xs px-2 py-0.5 rounded-full bg-gray-100 border"
      >
        {{ abilityLabels[k as AbilityKey] ?? k }}: {{ v }}
      </span>
    </div>
  </li>
</template>

<style scoped>
</style>
