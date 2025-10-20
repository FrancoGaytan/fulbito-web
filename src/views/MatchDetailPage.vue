<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { t } from '@/localizations';
import { useRoute } from "vue-router";
import * as matchesApi from "../lib/matches.service";
import { usePlayers } from "../stores/players";
import type { UUID, Match, RatingChange, MatchesGroupResponse, MyVotesResponse } from "../types";

const route = useRoute();
const id = route.params.id as UUID;
const groupId = (route.query.group as string) || "";

const players = usePlayers();
const current = ref<Match | null>(null);
const meta = ref<MatchesGroupResponse['meta'] | null>(null);
const loading = ref(true);
const loadingGen = ref(false);
const applyingRatings = ref(false);
const localChanges = ref<RatingChange[]>([]);
const myVotesState = ref<MyVotesResponse | null>(null);
const editingResult = ref(false);
const editScoreA = ref<number | null>(null);
const editScoreB = ref<number | null>(null);
const updateResultError = ref<string | null>(null);

/**
 * Fetch match (within its group list) & hydrate votes on mount.
 * @returns {Promise<void>} Resolves when initial data (players, match, votes) is loaded.
 */
onMounted(async () => {
  try {
    await players.fetch();
    if (groupId) {
      const resp = await matchesApi.listByGroup(groupId as UUID);
      meta.value = resp.meta;
      current.value = resp.matches.find((m) => m._id === id) ?? null;
      if (current.value) await hydrateMyVotes();
    }
  } finally {
    loading.value = false;
  }
});

/**
 * Load current user voting state and rating changes if already applied.
 * Populates myVotesState, localChanges and augments current match object with vote info.
 * Safe to call multiple times; acts as a refresh.
 * @returns {Promise<void>} Promise that settles after network call.
 */
async function hydrateMyVotes() {
  if (!current.value) return;
  try {
    const mv = await matchesApi.getMyVotes(current.value._id);
    myVotesState.value = mv;
    if (mv.ratingApplied && mv.ratingChanges) localChanges.value = mv.ratingChanges;
    current.value.myVotes = mv.myVotedPlayerIds as any;
    if (mv.ratingApplied) current.value.ratingApplied = true as any;
    if (mv.ratingChanges) current.value.ratingChanges = mv.ratingChanges as any;
  } catch (e) {
  console.warn(t('matchDetail.voteError'), e);
  }
}

/**
 * Whether the match is finalized (result present or status flag set to 'finalized').
 * @returns {boolean} True if there's a stored result or explicit finalized status.
 */
const isFinalized = computed(() => !!current.value?.result || current.value?.status === "finalized");

/**
 * Whether ratings have already been applied (either match-wide or reflected in myVotesState).
 * @returns {boolean}
 */
const ratingApplied = computed(() => !!current.value?.ratingApplied || !!myVotesState.value?.ratingApplied);

// Permisos para aplicar ratings: permitir si todavía no se aplicaron y el usuario es owner del match o del grupo
/**
 * Permission gate for applying ratings.
 * Allows if ratings not yet applied and user can edit match or owns group/match.
 * @returns {boolean}
 */
const canApply = computed(() => {
  if (ratingApplied.value) return false;
  return !!(current.value?.canEdit || meta.value?.isOwner || current.value?.isOwnerMatch);
});

/**
 * Final score abstraction; when a persisted result exists it takes precedence, else live team scores.
 * @returns {{ a: number; b: number }} Object containing team A and B numeric scores.
 */
const finalScore = computed(() => {
  const r = (current.value as any)?.result;
  const a = r?.scoreA ?? current.value?.teams?.[0]?.score ?? 0;
  const b = r?.scoreB ?? current.value?.teams?.[1]?.score ?? 0;
  return { a, b };
});

/**
 * Localized finalized datetime string for display.
 * @returns {string} Locale formatted date-time or empty string if not finalized.
 */
const finalizedAt = computed(() => {
  const at = (current.value as any)?.result?.finalizedAt;
  return at ? new Date(at).toLocaleString() : "";
});

/**
 * Enter edit mode for final result allowing update of stored scores.
 * Preconditions: match exists, is finalized, ratings not applied.
 * @returns {void}
 */
function startEditResult() {
  if (!current.value || !isFinalized.value || ratingApplied.value) return;
  editingResult.value = true;
  editScoreA.value = finalScore.value.a;
  editScoreB.value = finalScore.value.b;
  updateResultError.value = null;
}

/**
 * Exit result edit mode discarding any unpersisted edits and clearing errors.
 * @returns {void}
 */
function cancelEditResult() {
  editingResult.value = false;
  editScoreA.value = null;
  editScoreB.value = null;
  updateResultError.value = null;
}

/**
 * Persist edited result via matchesApi.updateResult and update local state.
 * Validates score refs are not null and clamps to >= 0.
 * @returns {Promise<void>} Resolves after attempting save; sets updateResultError on failure.
 */
async function saveEditedResult() {
  if (!current.value || editScoreA.value == null || editScoreB.value == null) return;
  updateResultError.value = null;
  try {
    const updated = await matchesApi.updateResult(current.value._id, Math.max(0, editScoreA.value), Math.max(0, editScoreB.value));
    current.value = updated;
    editingResult.value = false;
  } catch (e: any) {
    updateResultError.value = e?.message || t('matchDetail.updateResultError');
  }
}

/**
 * Finalize the match using current score inputs when teams exist and not already finalized.
 * Also triggers a players store refresh to update ratings.
 * @returns {Promise<void>}
 */
async function finish() {
  if (!current.value) return;
  if (isFinalized.value) return;
  if (!hasTeams.value) return;
  const updated = await matchesApi.finalize(
    current.value._id,
    scoreA.value,
    scoreB.value
  );
  current.value = updated;
  try { await players.fetch(); } catch (e) { console.warn('No se pudo refrescar jugadores', e); }
}

// Equipos
/**
 * Whether there are at least two teams defined containing player entries.
 * @returns {boolean}
 */
const hasTeams = computed(() => {
  const teams = (current.value as any)?.teams ?? [];
  if (!Array.isArray(teams) || teams.length < 2) return false;
  const total =
    (teams[0]?.players?.length ?? 0) + (teams[1]?.players?.length ?? 0);
  return total > 0;
});

/**
 * Map participant player IDs to lightweight objects before teams are generated.
 * @returns {{ id: string; name: string }[]}
 */
const participants = computed(() => {
  const ids = (current.value?.participants ?? []) as string[];
  return ids.map((pid) => ({ id: pid, name: players.nameById(pid) }));
});

/**
 * Team A mapped with player names for display.
 * @returns {{ id: string; name: string }[]}
 */
const teamA = computed(() => {
  const t = ((current.value as any)?.teams ?? [])[0];
  const ids: string[] = t?.players ?? [];
  return ids.map((id) => ({ id, name: players.nameById(id) }));
});
/**
 * Team B mapped with player names for display.
 * @returns {{ id: string; name: string }[]}
 */
const teamB = computed(() => {
  const t = ((current.value as any)?.teams ?? [])[1];
  const ids: string[] = t?.players ?? [];
  return ids.map((id) => ({ id, name: players.nameById(id) }));
});


/**
 * Remaining players needing a vote from current user (excludes those already voted on).
 * Returns empty list if match not finalized or ratings applied.
 * @returns {{ id: string; name: string }[]}
 */
const playersForRating = computed(() => {
  if (!isFinalized.value || ratingApplied.value) return [] as { id: string; name: string }[];
  const merged: Record<string, { id: string; name: string }> = {};
  for (const p of teamA.value) merged[p.id] = p;
  for (const p of teamB.value) merged[p.id] = p;
  const mySet = new Set((current.value?.myVotes ?? myVotesState.value?.myVotedPlayerIds ?? []).map(String));
  return Object.values(merged).filter((p) => !mySet.has(p.id));
});

/**
 * Generate teams using AI assisted service with a time-based seed for variability.
 * Requires edit permission on current match.
 * @returns {Promise<void>}
 */
async function autoTeams() {
  if (!current.value || !current.value.canEdit) return;
  loadingGen.value = true;
  try {
    const { teams } = await matchesApi.generateTeams(current.value._id, {
      ai: true,
      seed: Date.now(),
    });
    (current.value as any).teams = teams;
  } finally {
    loadingGen.value = false;
  }
}
// Finalización y votos
const scoreA = ref<number>(0);
const scoreB = ref<number>(0);

/**
 * Cast a performance vote for a given player in the finalized match.
 * Updates local myVotes and refreshes aggregate vote state.
 * @param {UUID} playerId Player identifier being voted.
 * @param {'up' | 'neutral' | 'down'} vote Vote value.
 * @returns {Promise<void>}
 */
async function votePlayer(playerId: UUID, vote: 'up' | 'neutral' | 'down') {
  if (!current.value || ratingApplied.value) return;
  try {
    await matchesApi.voteMatchPlayer(current.value._id, playerId, vote);
    // Actualizamos myVotes localmente para no requerir refetch inmediato
  if (!current.value.myVotes) current.value.myVotes = [] as any;
  const mv = current.value.myVotes as UUID[];
  if (!mv.includes(playerId)) mv.push(playerId);
    await hydrateMyVotes();
  } catch (e: any) {
    console.error(e);
  alert(e?.message || t('matchDetail.voteError'));
  }
}

/**
 * Apply ratings (if permitted) once there are no remaining pending votes.
 * Confirms with the user, then persists and hydrates local changes.
 * @returns {Promise<void>}
 */
async function applyRatingsNow() {
  if (!current.value) return;
  if (!canApply.value) return;
  // Opcional: confirmar (especialmente si más adelante tenemos gating multi-usuario)
  if (!window.confirm(t('matchDetail.confirmApply'))) return;
  applyingRatings.value = true;
  try {
    const res = await matchesApi.applyRatings(current.value._id);
    current.value.ratingApplied = true as any;
    current.value.ratingChanges = res.changes as any;
    localChanges.value = res.changes;
    await hydrateMyVotes();
  } catch (e: any) {
  console.error(e);
  alert(e?.message || t('matchDetail.applyError'));
  } finally {
    applyingRatings.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
      <div v-if="loading" class="fixed inset-0 flex items-center justify-center px-4">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="relative w-14 h-14">
            <span class="absolute inset-0 rounded-full border-4 border-indigo-200"></span>
            <span class="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></span>
          </div>
          <p class="text-sm font-medium text-gray-700">{{ t('matchDetail.loading') }}</p>
        </div>
      </div>
      <template v-if="!loading && current">
    <div class="flex items-center gap-3">
  <h1 class="text-2xl font-semibold">{{ t('matchDetail.title') }}</h1>
      <button
        class="ml-auto px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          :disabled="loadingGen || !current || isFinalized || !current.canEdit"
        @click="autoTeams"
        v-if="current.canEdit"
      >
          {{ loadingGen ? t('matchDetail.generating') : t('matchDetail.generateTeams')}}
      </button>
    </div>

    <div v-if="hasTeams" class="grid md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-xl shadow border space-y-2">
  <h2 class="font-medium">{{ t('matchDetail.teamA') }}</h2>
        <ul class="space-y-1">
          <li v-for="p in teamA" :key="p.id" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-gray-400" />
            <span>{{ p.name }}</span>
          </li>
        </ul>
      </div>
      <div class="bg-white p-4 rounded-xl shadow border space-y-2">
  <h2 class="font-medium">{{ t('matchDetail.teamB') }}</h2>
        <ul class="space-y-1">
          <li v-for="p in teamB" :key="p.id" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-gray-400" />
            <span>{{ p.name }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 2) Si TODAVÍA NO hay equipos, muestro "Jugadores anotados" -->
    <div v-else class="bg-white p-4 rounded-xl shadow border space-y-2">
  <h2 class="font-medium">{{ t('matchDetail.signedPlayers') }}</h2>
      <p class="text-sm text-gray-500" v-if="participants.length === 0">
  {{ t('matchDetail.noSignedPlayers') }}
      </p>
      <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <li
          v-for="p in participants"
          :key="p.id"
          class="flex items-center gap-2 border rounded px-3 py-2"
        >
          <span class="w-2 h-2 rounded-full bg-gray-400" />
          <span>{{ p.name }}</span>
        </li>
      </ul>
    </div>

    <!-- ─────── Resultado / Finalización ─────── -->
    <div class="bg-white p-4 rounded-xl shadow border">
  <h2 class="font-medium mb-3">{{ t('matchDetail.result') }}</h2>

      <!-- ya finalizado -->
      <template v-if="isFinalized">
        <!-- View mode -->
        <template v-if="!editingResult">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="text-lg font-semibold">
              {{ finalScore.a }} — {{ finalScore.b }}
            </div>
            <button
              v-if="current?.canEdit && !ratingApplied"
              @click="startEditResult"
              class="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50"
            >{{ t('matchDetail.editResult') }}</button>
          </div>
          <div class="text-xs opacity-60" v-if="finalizedAt">
            {{ t('matchDetail.finalizedAt') }} {{ finalizedAt }}
          </div>
        </template>
        <!-- Edit mode -->
        <template v-else>
          <div class="flex items-center gap-2">
            <input type="number" min="0" class="border rounded px-2 py-1 w-20" v-model.number="editScoreA" />
            <span class="opacity-60">—</span>
            <input type="number" min="0" class="border rounded px-2 py-1 w-20" v-model.number="editScoreB" />
            <button @click="saveEditedResult" class="px-3 py-1 rounded bg-black text-white text-xs">{{ t('matchDetail.updateResult') }}</button>
            <button @click="cancelEditResult" class="px-3 py-1 rounded border text-xs">{{ t('matchDetail.cancel') }}</button>
          </div>
          <p v-if="updateResultError" class="text-xs text-red-600 mt-2">{{ updateResultError }}</p>
        </template>
        <!-- View mode -->
        <template v-if="!editingResult">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="text-lg font-semibold">
              {{ finalScore.a }} — {{ finalScore.b }}
            </div>
            <button
              v-if="current?.canEdit && !ratingApplied"
              @click="startEditResult"
              class="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50"
            >{{ t('matchDetail.editResult') }}</button>
          </div>
          <div class="text-xs opacity-60" v-if="finalizedAt">
            {{ t('matchDetail.finalizedAt') }} {{ finalizedAt }}
          </div>
        </template>
        <!-- Edit mode -->
        <template v-else>
          <div class="flex items-center gap-2">
            <input type="number" min="0" class="border rounded px-2 py-1 w-20" v-model.number="editScoreA" />
            <span class="opacity-60">—</span>
            <input type="number" min="0" class="border rounded px-2 py-1 w-20" v-model.number="editScoreB" />
            <button @click="saveEditedResult" class="px-3 py-1 rounded bg-black text-white text-xs">{{ t('matchDetail.updateResult') }}</button>
            <button @click="cancelEditResult" class="px-3 py-1 rounded border text-xs">{{ t('matchDetail.cancel') }}</button>
          </div>
          <p v-if="updateResultError" class="text-xs text-red-600 mt-2">{{ updateResultError }}</p>
        </template>
      </template>

      <!-- todavía no finalizado -->
      <template v-else>
        <div class="flex items-center gap-2">
          <input
            type="number"
            class="border rounded px-2 py-1 w-20"
            v-model.number="scoreA"
            min="0"
          />
          <span class="opacity-60">—</span>
          <input
            type="number"
            class="border rounded px-2 py-1 w-20"
            v-model.number="scoreB"
            min="0"
          />
          <button
            @click="finish"
            class="ml-3 px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            :disabled="isFinalized || !hasTeams || !current?.canEdit"
          >
            {{ t('matchDetail.finalize') }}
          </button>
        </div>
  <p v-if="!hasTeams" class="mt-2 text-xs text-red-600">{{ t('matchDetail.needTeamsFirst') }}</p>
      </template>
    </div>

    <!-- ─────── Feedback / Calificación Jugadores ─────── -->
    <div v-if="isFinalized" class="bg-white p-4 rounded-xl shadow border space-y-4">
      <template v-if="!ratingApplied">
  <h2 class="font-medium flex items-center gap-2">{{ t('matchDetail.ratePlayers') }}
          <span class="text-xs font-normal text-gray-500" v-if="playersForRating.length">({{ playersForRating.length }} pendientes)</span>
        </h2>
        <p v-if="playersForRating.length === 0" class="text-sm text-gray-500">
          {{ t('matchDetail.allRated') }}
        </p>
        <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <li v-for="p in playersForRating" :key="p.id" class="flex items-center justify-between gap-2 border rounded px-3 py-2">
            <span class="truncate">{{ p.name }}</span>
            <div class="flex items-center gap-1">
              <button @click="votePlayer(p.id as UUID, 'down')" class="w-8 h-8 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200" :title="t('matchDetail.bad')">👎</button>
              <button @click="votePlayer(p.id as UUID, 'neutral')" class="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200" :title="t('matchDetail.neutral')">😐</button>
              <button @click="votePlayer(p.id as UUID, 'up')" class="w-8 h-8 flex items-center justify-center rounded bg-green-100 text-green-600 hover:bg-green-200" :title="t('matchDetail.good')">👍</button>
            </div>
          </li>
        </ul>
        <div class="pt-2 border-t space-y-2">
          <button
            v-if="canApply && playersForRating.length === 0"
            @click="applyRatingsNow"
            :disabled="applyingRatings"
            class="px-4 py-2 rounded bg-black text-white disabled:opacity-40"
          >
            {{ applyingRatings ? t('matchDetail.applying') : t('matchDetail.apply') }}
          </button>
          <p v-else-if="playersForRating.length === 0" class="text-xs text-gray-500">
            {{ t('matchDetail.waitingOrganizer') }}
          </p>
          <p v-else class="text-xs text-gray-500">
            {{ t('matchDetail.pendingYourVotes') }}
          </p>
        </div>
      </template>
      <template v-else>
  <h2 class="font-medium">{{ t('matchDetail.ratingChanges') }}</h2>
  <p class="text-sm text-gray-500" v-if="(current?.ratingChanges?.length || 0) === 0">{{ t('matchDetail.noChanges') }}</p>
        <table v-else class="w-full text-sm border-t">
          <thead>
            <tr class="text-left">
              <th class="py-2 pr-2">{{ t('matchDetail.colPlayer') }}</th>
              <th class="py-2 pr-2">{{ t('matchDetail.colBefore') }}</th>
              <th class="py-2 pr-2">{{ t('matchDetail.colAfter') }}</th>
              <th class="py-2 pr-2">{{ t('matchDetail.colDelta') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in (current?.ratingChanges || localChanges)" :key="c.playerId" class="border-t">
              <td class="py-1 pr-2">{{ players.nameById(c.playerId) }}</td>
              <td class="py-1 pr-2">{{ c.before }}</td>
              <td class="py-1 pr-2">{{ c.after }}</td>
              <td class="py-1 pr-2 font-medium" :class="c.delta>0 ? 'text-green-600' : c.delta<0 ? 'text-red-600' : 'text-gray-500'">{{ c.delta>0? '+'+c.delta : c.delta }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin 0.9s linear infinite; }
</style>
