<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { t } from '@/localizations';
import * as matchesApi from '../lib/matches.service';
import { usePlayers } from '../stores/players';
import type { Match, UUID } from '../types';
import {
  createDefaultFormation,
  getHorizontalPositions,
  getTeamLinePositions,
  type FormationCounts,
  type FormationRole,
} from '../utils/formation';

type TeamKey = 'A' | 'B';

interface RosterPlayer {
  id: UUID;
  name: string;
}

interface FormationSlot {
  id: string;
  team: TeamKey;
  role: FormationRole;
  roleLabel: string;
  shortLabel: string;
  index: number;
  x: number;
  y: number;
}

const route = useRoute();
const router = useRouter();
const playerStore = usePlayers();
const match = ref<Match | null>(null);
const loading = ref(true);
const error = ref('');
const formations = ref<Record<TeamKey, FormationCounts>>({
  A: createDefaultFormation(0),
  B: createDefaultFormation(0),
});
const assignments = ref<Record<string, UUID>>({});
const selectedPlayer = ref<{ team: TeamKey; id: UUID } | null>(null);

const teamIds = computed<Record<TeamKey, UUID[]>>(() => ({
  A: match.value?.teams?.[0]?.players ?? [],
  B: match.value?.teams?.[1]?.players ?? [],
}));

const rosters = computed<Record<TeamKey, RosterPlayer[]>>(() => ({
  A: teamIds.value.A.map(id => ({
    id,
    name: playerStore.items.find(player => player._id === id)?.name ?? id.slice(-6),
  })),
  B: teamIds.value.B.map(id => ({
    id,
    name: playerStore.items.find(player => player._id === id)?.name ?? id.slice(-6),
  })),
}));

const teamNames = computed<Record<TeamKey, string>>(() => ({
  A: match.value?.teams?.[0]?.name || t('matchFormation.teamA'),
  B: match.value?.teams?.[1]?.name || t('matchFormation.teamB'),
}));

const roleControls: { role: FormationRole; label: string; short: string }[] = [
  { role: 'goalkeeper', label: t('matchFormation.goalkeeper'), short: t('matchFormation.goalkeeperShort') },
  { role: 'defenders', label: t('matchFormation.defenders'), short: t('matchFormation.defenderShort') },
  { role: 'midfielders', label: t('matchFormation.midfielders'), short: t('matchFormation.midfielderShort') },
  { role: 'forwards', label: t('matchFormation.forwards'), short: t('matchFormation.forwardShort') },
];

function slotsForTeam(team: TeamKey): FormationSlot[] {
  const counts = formations.value[team];
  const sideY = getTeamLinePositions(team);

  return roleControls.flatMap(({ role, label, short }) =>
    Array.from({ length: counts[role] }, (_, index) => ({
      id: `${team}-${role}-${index + 1}`,
      team,
      role,
      roleLabel: label,
      shortLabel: short,
      index: index + 1,
      x: getHorizontalPositions(counts[role])[index] ?? 50,
      y: sideY[team][role],
    })),
  );
}

const allSlots = computed(() => [...slotsForTeam('A'), ...slotsForTeam('B')]);
function assignedPlayer(slotId: string): RosterPlayer | undefined {
  const playerId = assignments.value[slotId];
  if (!playerId) return undefined;
  const team = slotId.startsWith('A-') ? 'A' : 'B';
  return rosters.value[team].find(player => player.id === playerId);
}

function assignedIds(team: TeamKey): Set<UUID> {
  return new Set(
    Object.entries(assignments.value)
      .filter(([slotId]) => slotId.startsWith(`${team}-`))
      .map(([, playerId]) => playerId),
  );
}

function assignPlayer(team: TeamKey, slotId: string, playerId: UUID) {
  if (!slotsForTeam(team).some(slot => slot.id === slotId)) return;
  if (!rosters.value[team].some(player => player.id === playerId)) return;

  for (const [existingSlot, assignedId] of Object.entries(assignments.value)) {
    if (assignedId === playerId) delete assignments.value[existingSlot];
  }
  assignments.value[slotId] = playerId;
  selectedPlayer.value = null;
}

function togglePlayerSelection(team: TeamKey, playerId: UUID) {
  if (selectedPlayer.value?.team === team && selectedPlayer.value.id === playerId) {
    selectedPlayer.value = null;
    return;
  }
  selectedPlayer.value = { team, id: playerId };
}

function assignSelectedPlayer(slot: FormationSlot) {
  if (selectedPlayer.value?.team === slot.team) {
    assignPlayer(slot.team, slot.id, selectedPlayer.value.id);
    return;
  }
  if (!selectedPlayer.value && assignments.value[slot.id]) {
    delete assignments.value[slot.id];
  }
}

function onPlayerDragStart(event: DragEvent, team: TeamKey, playerId: UUID) {
  event.dataTransfer?.setData('text/plain', JSON.stringify({ team, playerId }));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function onSlotDrop(event: DragEvent, slot: FormationSlot) {
  const raw = event.dataTransfer?.getData('text/plain');
  if (!raw) return;
  try {
    const data = JSON.parse(raw) as { team?: TeamKey; playerId?: UUID };
    if (data.team === slot.team && data.playerId) {
      assignPlayer(slot.team, slot.id, data.playerId);
    }
  } catch (dropError) {
    console.warn('No se pudo leer el jugador arrastrado', dropError);
  }
}

function changeRoleCount(team: TeamKey, role: FormationRole, delta: number) {
  const current = formations.value[team];
  const nextCount = current[role] + delta;
  const total = Object.values(current).reduce((sum, count) => sum + count, 0);
  const teamSize = rosters.value[team].length;

  if (nextCount < 0 || (role === 'goalkeeper' && nextCount > 1)) return;
  if (delta > 0 && total >= teamSize) return;

  if (delta < 0) {
    const removedSlot = `${team}-${role}-${current[role]}`;
    delete assignments.value[removedSlot];
  }

  formations.value[team] = { ...current, [role]: nextCount };
}

function resetFormations() {
  if (!window.confirm(t('matchFormation.resetConfirm'))) return;
  formations.value = {
    A: createDefaultFormation(rosters.value.A.length),
    B: createDefaultFormation(rosters.value.B.length),
  };
  assignments.value = {};
  selectedPlayer.value = null;
}

function goBack() {
  if (!match.value) {
    router.back();
    return;
  }
  router.push({
    name: 'match-detail',
    params: { id: match.value._id },
    query: { group: match.value.groupId },
  });
}

async function loadMatch() {
  const matchId = String(route.params.id ?? '');
  if (!matchId) {
    error.value = t('matchFormation.loadError');
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const [loadedMatch] = await Promise.all([
      matchesApi.getMatch(matchId),
      playerStore.fetch(),
    ]);
    match.value = loadedMatch;
    formations.value = {
      A: createDefaultFormation(loadedMatch.teams?.[0]?.players.length ?? 0),
      B: createDefaultFormation(loadedMatch.teams?.[1]?.players.length ?? 0),
    };
    assignments.value = {};
    selectedPlayer.value = null;
  } catch (loadError: unknown) {
    error.value = loadError instanceof Error ? loadError.message : t('matchFormation.loadError');
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, loadMatch, { immediate: true });
</script>

<template>
  <section class="space-y-5">
    <button type="button" class="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      @click="goBack">
      <span aria-hidden="true">←</span> {{ t('matchFormation.backToMatch') }}
    </button>

    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-accent">{{ t('matchFormation.field') }}</p>
        <h1 class="mt-1 text-2xl font-bold text-white sm:text-3xl">{{ t('matchFormation.title') }}</h1>
        <p class="mt-1 max-w-xl text-sm text-gray-400">{{ t('matchFormation.subtitle') }}</p>
      </div>
      <button v-if="match && !loading && allSlots.length" type="button"
        class="btn-outline !w-auto px-3 py-2 text-xs" @click="resetFormations">
        {{ t('matchFormation.reset') }}
      </button>
    </header>

    <div v-if="loading" class="card flex min-h-56 items-center justify-center text-sm text-gray-400">
      {{ t('matchFormation.loading') }}
    </div>
    <div v-else-if="error" class="card space-y-3 p-5 text-center">
      <p class="text-sm text-red-300">{{ error }}</p>
      <button type="button" class="btn-outline !w-auto px-4 py-2" @click="loadMatch">
        {{ t('matchFormation.retry') }}
      </button>
    </div>
    <div v-else-if="!match || !match.teams || match.teams.length < 2" class="card p-5 text-center text-sm text-gray-400">
      {{ t('matchFormation.noTeams') }}
    </div>

    <template v-else>
      <div class="grid items-start gap-4 xl:grid-cols-[minmax(210px,1fr)_minmax(290px,410px)_minmax(210px,1fr)]">
        <section v-for="team in (['A', 'B'] as const)" :key="team"
          class="card order-2 space-y-4 p-4 xl:order-none"
          :class="team === 'A' ? 'xl:col-start-1 xl:row-start-1' : 'xl:col-start-3 xl:row-start-1'">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-wider"
                :class="team === 'A' ? 'text-accent' : 'text-blue-300'">
                {{ team === 'A' ? t('matchFormation.teamA') : t('matchFormation.teamB') }}
              </p>
              <h2 class="truncate font-bold text-white">{{ teamNames[team] }}</h2>
            </div>
            <span class="rounded-full bg-dark-600 px-2.5 py-1 text-xs font-semibold text-gray-300">
              {{ rosters[team].length }} {{ t('matchFormation.teamSize') }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div v-for="control in roleControls" :key="control.role"
              class="rounded-xl border border-dark-500/40 bg-dark-900/60 p-2">
              <p class="mb-1.5 truncate text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {{ control.label }}
              </p>
              <div class="flex items-center justify-between">
                <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg bg-dark-600 text-gray-300 transition hover:bg-dark-500 disabled:opacity-30"
                  :aria-label="`Quitar ${control.label}`"
                  :disabled="formations[team][control.role] === 0"
                  @click="changeRoleCount(team, control.role, -1)">−</button>
                <span class="min-w-5 text-center text-sm font-bold text-white">
                  {{ formations[team][control.role] }}
                </span>
                <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg bg-dark-600 text-gray-300 transition hover:bg-dark-500 disabled:opacity-30"
                  :aria-label="`Agregar ${control.label}`"
                  :disabled="(control.role === 'goalkeeper' && formations[team].goalkeeper === 1) ||
                    Object.values(formations[team]).reduce((sum, count) => sum + count, 0) >= rosters[team].length"
                  @click="changeRoleCount(team, control.role, 1)">+</button>
              </div>
            </div>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400">{{ t('matchFormation.players') }}</h3>
              <span class="text-[10px] text-gray-500">{{ t('matchFormation.dragHint') }}</span>
            </div>
            <p v-if="selectedPlayer?.team === team" class="mb-2 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs text-accent">
              {{ t('matchFormation.tapHint') }}
            </p>
            <ul class="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              <li v-for="player in rosters[team]" :key="player.id">
                <button type="button" draggable="true"
                  class="flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition"
                  :class="[
                    selectedPlayer?.team === team && selectedPlayer.id === player.id
                      ? 'border-accent bg-accent/10'
                      : 'border-dark-500/40 bg-dark-900/60 hover:border-dark-400',
                    assignedIds(team).has(player.id) ? 'opacity-65' : '',
                  ]"
                  @click="togglePlayerSelection(team, player.id)"
                  @dragstart="onPlayerDragStart($event, team, player.id)">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    :class="team === 'A' ? 'bg-accent/15 text-accent' : 'bg-blue-400/15 text-blue-300'">
                    {{ player.name.slice(0, 1).toUpperCase() }}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-sm text-gray-200">{{ player.name }}</span>
                  <span v-if="assignedIds(team).has(player.id)" class="text-[10px] text-gray-500">
                    {{ t('matchFormation.assigned') }}
                  </span>
                  <span v-else class="text-[10px] text-gray-500">{{ t('matchFormation.available') }}</span>
                </button>
              </li>
            </ul>
          </div>
        </section>

        <section class="order-1 flex flex-col items-center gap-2 xl:order-none xl:col-start-2 xl:row-start-1">
          <div class="flex w-full max-w-[410px] items-center justify-between px-1">
            <span class="text-xs font-semibold text-accent">{{ teamNames.A }}</span>
            <span class="text-[10px] uppercase tracking-[0.16em] text-gray-500">{{ t('matchFormation.field') }}</span>
            <span class="text-xs font-semibold text-blue-300">{{ teamNames.B }}</span>
          </div>
          <div class="formation-pitch relative aspect-[2/3] w-full max-w-[410px] overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div class="pitch-stripes absolute inset-0" aria-hidden="true"></div>
            <svg class="absolute inset-0 h-full w-full text-white/55" viewBox="0 0 400 600" fill="none"
              preserveAspectRatio="none" aria-hidden="true">
              <rect x="14" y="14" width="372" height="572" rx="8" stroke="currentColor" stroke-width="2" />
              <path d="M14 300H386" stroke="currentColor" stroke-width="2" />
              <circle cx="200" cy="300" r="52" stroke="currentColor" stroke-width="2" />
              <circle cx="200" cy="300" r="3" fill="currentColor" />
              <rect x="100" y="14" width="200" height="76" stroke="currentColor" stroke-width="2" />
              <rect x="145" y="14" width="110" height="28" stroke="currentColor" stroke-width="2" />
              <rect x="100" y="510" width="200" height="76" stroke="currentColor" stroke-width="2" />
              <rect x="145" y="558" width="110" height="28" stroke="currentColor" stroke-width="2" />
              <path d="M170 90a30 30 0 0 0 60 0M170 510a30 30 0 0 1 60 0" stroke="currentColor" stroke-width="2" />
              <path d="M14 42h24v24H14M386 42h-24v24h24M14 558h24v-24H14M386 558h-24v-24h24" stroke="currentColor" stroke-width="2" />
            </svg>

            <div class="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 text-center">
              <span class="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
                FulbITo
              </span>
            </div>

            <button v-for="slot in allSlots" :key="slot.id" type="button"
              class="formation-slot absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl p-1 transition"
              :class="[
                teamIds[slot.team].length === 0 ? 'opacity-40' : '',
                assignedPlayer(slot.id) ? 'scale-100' : 'scale-95 hover:scale-100',
                selectedPlayer?.team === slot.team ? 'ring-2 ring-white/80' : '',
              ]"
              :style="{ left: `${slot.x}%`, top: `${slot.y}%` }"
              :aria-label="`${slot.roleLabel} ${slot.index}: ${assignedPlayer(slot.id)?.name ?? t('matchFormation.emptySlot')}`"
              :draggable="!!assignedPlayer(slot.id)"
              @click="assignSelectedPlayer(slot)"
              @dragover.prevent
              @drop.prevent="onSlotDrop($event, slot)"
              @dragstart="assignedPlayer(slot.id) && onPlayerDragStart($event, slot.team, assignedPlayer(slot.id)!.id)">
              <span class="flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-lg sm:h-11 sm:w-11 sm:text-xs"
                :class="[
                  assignedPlayer(slot.id)
                    ? (slot.team === 'A' ? 'border-white bg-accent text-dark-900' : 'border-white bg-blue-400 text-dark-900')
                    : 'border-dashed border-white/60 bg-dark-900/80 text-white',
                ]">
                {{ assignedPlayer(slot.id)?.name.slice(0, 1).toUpperCase() ?? slot.shortLabel }}
              </span>
              <span class="max-w-[72px] truncate rounded-full bg-dark-900/90 px-1.5 py-0.5 text-[8px] font-semibold text-white shadow sm:max-w-[92px] sm:text-[9px]">
                {{ assignedPlayer(slot.id)?.name ?? slot.roleLabel }}
              </span>
            </button>

            <div v-if="allSlots.length === 0" class="absolute inset-0 z-[2] flex items-center justify-center p-8 text-center text-xs text-white/80">
              {{ t('matchFormation.noTeams') }}
            </div>
          </div>
          <p class="max-w-[410px] text-center text-[11px] leading-relaxed text-gray-500">
            {{ t('matchFormation.tapHint') }} · {{ t('matchFormation.changesNotSaved') }}
          </p>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.formation-pitch {
  background:
    radial-gradient(ellipse at 50% 50%, rgba(52, 211, 153, .22), transparent 70%),
    linear-gradient(160deg, #14532d, #166534 46%, #14532d);
}

.pitch-stripes {
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 255, 255, .035) 0,
    rgba(255, 255, 255, .035) 60px,
    rgba(0, 0, 0, .035) 60px,
    rgba(0, 0, 0, .035) 120px
  );
}

.formation-slot {
  touch-action: manipulation;
}
</style>
