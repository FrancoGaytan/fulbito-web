<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
import * as matchesApi from "../lib/matches.service";
import { usePlayers } from "../stores/players";
import type { UUID, Match } from "../types";

const route = useRoute();
const id = route.params.id as UUID;
const groupId = (route.query.group as string) || "";

const players = usePlayers();
const current = ref<Match | null>(null); // match actual
const loadingGen = ref(false);

onMounted(async () => {
  // necesitamos nombres para mapear ids -> nombres
  await players.fetch();

  if (groupId) {
    const list = await matchesApi.listByGroup(groupId as UUID);
    current.value = list.find((m) => m._id === id) ?? null;
  }
});

const isFinalized = computed(() => {
  return !!current.value?.result || current.value?.status === "finalized";
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
  const updated = await matchesApi.finalize(
    current.value._id,
    scoreA.value,
    scoreB.value
  );
  current.value = updated;
}

/** Diccionario id->nombre para usar en los listados */
const nameById = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const p of players.items) map[p._id] = p.name;
  return map;
});

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
  return ids.map((pid) => ({ id: pid, name: nameById.value[pid] || pid }));
});

/** Equipos ya armados (cuando existen) */
const teamA = computed(() => {
  const t = ((current.value as any)?.teams ?? [])[0];
  const ids: string[] = t?.players ?? [];
  return ids.map((id) => ({ id, name: nameById.value[id] || id }));
});
const teamB = computed(() => {
  const t = ((current.value as any)?.teams ?? [])[1];
  const ids: string[] = t?.players ?? [];
  return ids.map((id) => ({ id, name: nameById.value[id] || id }));
});

/** Armar equipos */
async function autoTeams() {
  if (!current.value) return
  loadingGen.value = true
  try {
    const { teams } = await matchesApi.generateTeams(current.value._id, {
      ai: true,               // o false si querés probar fallback
      seed: Date.now(),       // cambia en cada click
    })
    ;(current.value as any).teams = teams
  } finally {
    loadingGen.value = false
  }
}

/** Finalizar (mantengo tu lógica) */
const scoreA = ref<number>(0);
const scoreB = ref<number>(0);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-semibold">Partido</h1>
      <button
        class="ml-auto px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        :disabled="loadingGen || !current || isFinalized"
        @click="autoTeams"
      >
        {{ loadingGen ? "Generando…" : "Generar equipos" }}
      </button>
    </div>

    <!-- ─────── Sección superior: PARTICIPANTES o EQUIPOS ─────── -->
    <!-- 1) Si YA hay equipos, muestro A y B -->
    <div v-if="hasTeams" class="grid md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-xl shadow border space-y-2">
        <h2 class="font-medium">Equipo A</h2>
        <ul class="space-y-1">
          <li v-for="p in teamA" :key="p.id" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-gray-400" />
            <span>{{ p.name }}</span>
          </li>
        </ul>
      </div>
      <div class="bg-white p-4 rounded-xl shadow border space-y-2">
        <h2 class="font-medium">Equipo B</h2>
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
            class="ml-3 px-4 py-2 rounded bg-black text-white"
          >
            Finalizar
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
