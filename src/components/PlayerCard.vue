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
    class="relative card p-4 space-y-3 overflow-hidden cursor-pointer hover:ring-1 hover:ring-accent/20 transition-all"
    @click="onRootClick"
  >
    <!-- Delete button -->
    <button
      type="button"
      @click.stop="remove"
      class="absolute top-3 right-3 w-7 h-7 inline-flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition"
      :title="t('players.deleteTitle')"
    >
      <span>✕</span>
    </button>

    <!-- Header row -->
    <div class="flex items-center gap-3 pr-8">
      <div class="w-10 h-10 rounded-full bg-dark-600 border border-dark-500/50 flex items-center justify-center text-accent font-bold text-sm shrink-0">
        {{ player.name.charAt(0).toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-semibold text-white truncate">{{ player.name }}</span>
          <span v-if="(player.gamesPlayed ?? 0) === 0" class="badge bg-yellow-500/20 text-yellow-400">{{ t('players.new') }}</span>
        </div>
        <div class="text-xs text-gray-500" v-if="player.nickname">@{{ player.nickname }}</div>
      </div>
    </div>

    <!-- Ownership badges -->
    <div class="flex items-center gap-2 flex-wrap">
      <template v-if="isMine()">
        <span class="badge-green">{{ t('players.myProfile') }}</span>
        <button type="button" @click.stop="unclaim" class="badge bg-red-500/20 text-red-400 hover:bg-red-500/30 transition cursor-pointer">{{ t('players.unclaim') }}</button>
      </template>
      <span v-else-if="isClaimed()" class="badge-gray">{{ t('players.claimed') }}</span>
      <button v-else-if="!myClaimedPlayerId" @click.stop="claim" class="badge bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition cursor-pointer">{{ t('players.claim') }}</button>
    </div>

    <!-- Stats -->
    <div v-if="player.gamesPlayed !== undefined" class="text-xs text-gray-500">
      {{ t('players.gamesPlayed') }} <span class="font-bold text-white">{{ player.gamesPlayed }}</span>
    </div>

    <!-- Ability badges -->
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="([k, v]) in Object.entries(player.abilities || {})"
        :key="k"
        class="text-[10px] px-2 py-0.5 rounded-full bg-dark-600 border border-dark-500/40 text-gray-300 font-medium"
      >
        {{ abilityLabels[k as AbilityKey] ?? k }}: <span class="text-accent">{{ v }}</span>
      </span>
    </div>
  </li>
</template>

<style scoped>
</style>
