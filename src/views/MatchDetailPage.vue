<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
import * as matchesApi from "../lib/matches.service";
import { usePlayers } from "../stores/players";
import type { UUID, Match, RatingChange, MatchesGroupResponse, MyVotesResponse } from "../types";

const route = useRoute();
const id = route.params.id as UUID;
const groupId = (route.query.group as string) || "";

const players = usePlayers();
const current = ref<Match | null>(null); // match actual
const meta = ref<MatchesGroupResponse['meta'] | null>(null);
const loading = ref(true);
const loadingGen = ref(false);
const applyingRatings = ref(false);
const localChanges = ref<RatingChange[]>([]);
// Estado individual de mis votos
const myVotesState = ref<MyVotesResponse | null>(null);

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
    console.warn('No se pudo cargar mis votos', e);
  }
}

const isFinalized = computed(() => !!current.value?.result || current.value?.status === "finalized");

const ratingApplied = computed(() => !!current.value?.ratingApplied || !!myVotesState.value?.ratingApplied);

// Permisos para aplicar ratings: permitir si todavía no se aplicaron y el usuario es owner del match o del grupo
const canApply = computed(() => {
  if (ratingApplied.value) return false;
  return !!(current.value?.canEdit || meta.value?.isOwner || current.value?.isOwnerMatch);
});

const finalScore = computed(() => {
  const r = (current.value as any)?.result;
  const a = r?.scoreA ?? current.value?.teams?.[0]?.score ?? 0;
  const b = r?.scoreB ?? current.value?.teams?.[1]?.score ?? 0;
  return { a, b };
});

const finalizedAt = computed(() => {
  const at = (current.value as any)?.result?.finalizedAt;
  return at ? new Date(at).toLocaleString() : "";
});

async function finish() {
  if (!current.value) return;
  if (isFinalized.value) return; // evita doble finalize
  if (!hasTeams.value) return; // no se puede finalizar sin equipos
  const updated = await matchesApi.finalize(
    current.value._id,
    scoreA.value,
    scoreB.value
  );
  current.value = updated;
  try { await players.fetch(); } catch (e) { console.warn('No se pudo refrescar jugadores', e); }
}

// Usamos getter del store (nameById(id))

/** ¿el match ya tiene equipos? */
const hasTeams = computed(() => {
  const teams = (current.value as any)?.teams ?? [];
  if (!Array.isArray(teams) || teams.length < 2) return false;
  const total =
    (teams[0]?.players?.length ?? 0) + (teams[1]?.players?.length ?? 0);
  return total > 0;
});

/** Participantes anotados al match (solo si aún no hay equipos) */
const participants = computed(() => {
  const ids = (current.value?.participants ?? []) as string[];
  return ids.map((pid) => ({ id: pid, name: players.nameById(pid) }));
});

/** Equipos ya armados (cuando existen) */
const teamA = computed(() => {
  const t = ((current.value as any)?.teams ?? [])[0];
  const ids: string[] = t?.players ?? [];
  return ids.map((id) => ({ id, name: players.nameById(id) }));
});
const teamB = computed(() => {
  const t = ((current.value as any)?.teams ?? [])[1];
  const ids: string[] = t?.players ?? [];
  return ids.map((id) => ({ id, name: players.nameById(id) }));
});


// Jugadores a calificar: union de A y B (solo cuando finalizado y no aplicado)
const playersForRating = computed(() => {
  if (!isFinalized.value || ratingApplied.value) return [] as { id: string; name: string }[];
  const merged: Record<string, { id: string; name: string }> = {};
  for (const p of teamA.value) merged[p.id] = p;
  for (const p of teamB.value) merged[p.id] = p;
  const mySet = new Set((current.value?.myVotes ?? myVotesState.value?.myVotedPlayerIds ?? []).map(String));
  return Object.values(merged).filter((p) => !mySet.has(p.id));
});

/** Armar equipos */
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
// (removido bloque duplicado de refresco de votos)

/** Finalizar (mantengo tu lógica) */
const scoreA = ref<number>(0);
const scoreB = ref<number>(0);

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
    alert(e?.message || 'No se pudo enviar el voto');
  }
}

async function applyRatingsNow() {
  if (!current.value) return;
  if (!canApply.value) return;
  // Opcional: confirmar (especialmente si más adelante tenemos gating multi-usuario)
  if (!window.confirm('¿Aplicar ratings ahora? Esto cerrará la votación para todos.')) return;
  applyingRatings.value = true;
  try {
    const res = await matchesApi.applyRatings(current.value._id);
    current.value.ratingApplied = true as any;
    current.value.ratingChanges = res.changes as any;
    localChanges.value = res.changes;
    await hydrateMyVotes();
  } catch (e: any) {
    console.error(e);
    alert(e?.message || 'No se pudieron aplicar los ratings');
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
          <p class="text-sm font-medium text-gray-700">Cargando partido…</p>
        </div>
      </div>
      <template v-if="!loading && current">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-semibold">Partido</h1>
      <button
        class="ml-auto px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          :disabled="loadingGen || !current || isFinalized || !current.canEdit"
        @click="autoTeams"
      >
          {{ loadingGen ? "Generando…" : current.canEdit ? "Generar equipos" : "Sin permiso" }}
      </button>
    </div>

    <div v-if="hasTeams" class="grid md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-xl shadow border space-y-2">
        <h2 class="font-medium">Equipo A (claro)</h2>
        <ul class="space-y-1">
          <li v-for="p in teamA" :key="p.id" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-gray-400" />
            <span>{{ p.name }}</span>
          </li>
        </ul>
      </div>
      <div class="bg-white p-4 rounded-xl shadow border space-y-2">
        <h2 class="font-medium">Equipo B (oscuro)</h2>
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
      <h2 class="font-medium">Jugadores anotados</h2>
      <p class="text-sm text-gray-500" v-if="participants.length === 0">
        Este partido no tiene jugadores anotados todavía.
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
      <h2 class="font-medium mb-3">Resultado</h2>

      <!-- ya finalizado -->
      <template v-if="isFinalized">
        <div class="text-lg font-semibold">
          {{ finalScore.a }} — {{ finalScore.b }}
        </div>
        <div class="text-xs opacity-60" v-if="finalizedAt">
          Finalizado: {{ finalizedAt }}
        </div>
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
            Finalizar
          </button>
        </div>
        <p v-if="!hasTeams" class="mt-2 text-xs text-red-600">Primero generá los equipos para poder finalizar.</p>
      </template>
    </div>

    <!-- ─────── Feedback / Calificación Jugadores ─────── -->
    <div v-if="isFinalized" class="bg-white p-4 rounded-xl shadow border space-y-4">
      <template v-if="!ratingApplied">
        <h2 class="font-medium flex items-center gap-2">Calificar jugadores
          <span class="text-xs font-normal text-gray-500" v-if="playersForRating.length">({{ playersForRating.length }} pendientes)</span>
        </h2>
        <p v-if="playersForRating.length === 0" class="text-sm text-gray-500">
          Todos calificados. Ahora podés aplicar los ratings.
        </p>
        <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <li v-for="p in playersForRating" :key="p.id" class="flex items-center justify-between gap-2 border rounded px-3 py-2">
            <span class="truncate">{{ p.name }}</span>
            <div class="flex items-center gap-1">
              <button @click="votePlayer(p.id as UUID, 'down')" class="w-8 h-8 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200" title="Mal desempeño">👎</button>
              <button @click="votePlayer(p.id as UUID, 'neutral')" class="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200" title="Neutral">😐</button>
              <button @click="votePlayer(p.id as UUID, 'up')" class="w-8 h-8 flex items-center justify-center rounded bg-green-100 text-green-600 hover:bg-green-200" title="Buen desempeño">👍</button>
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
            {{ applyingRatings ? 'Aplicando…' : 'Aplicar ratings' }}
          </button>
          <p v-else-if="playersForRating.length === 0" class="text-xs text-gray-500">
            Esperando que el organizador aplique los ratings…
          </p>
          <p v-else class="text-xs text-gray-500">
            Votá a los jugadores restantes para cerrar tu parte de la votación.
          </p>
        </div>
      </template>
      <template v-else>
        <h2 class="font-medium">Cambios de rating</h2>
        <p class="text-sm text-gray-500" v-if="(current?.ratingChanges?.length || 0) === 0">Sin cambios registrados.</p>
        <table v-else class="w-full text-sm border-t">
          <thead>
            <tr class="text-left">
              <th class="py-2 pr-2">Jugador</th>
              <th class="py-2 pr-2">Antes</th>
              <th class="py-2 pr-2">Después</th>
              <th class="py-2 pr-2">Δ</th>
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
