<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import CenteredLoader from '../components/CenteredLoader.vue';
import { useGroups } from "../stores/groups";
import { usePlayers } from "../stores/players";
import { listByGroup as apiListByGroup, create as apiCreateMatch, deleteMatch as apiDeleteMatch } from "../lib/matches.service";
import type { UUID, Match, MatchesGroupResponse } from "../types";

const groups = useGroups();
const players = usePlayers();
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([groups.fetch(), players.fetch()]);
  } finally { loading.value = false; }
});

function nowLocalForInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const selectedGroup = ref<UUID | "">("");
const selectedPlayers = ref<UUID[]>([]);
const when = ref<string>(nowLocalForInput());
const items = ref<Match[]>([]);
const meta = ref<MatchesGroupResponse['meta'] | null>(null);
const highlights = ref<Record<string, boolean>>({});

const groupMemberIds = computed<string[]>(() => {
  const g = groups.items.find((x) => x._id === selectedGroup.value);
  if (!g) return [];
  return ((g as any).members ?? (g as any).players ?? []).map((id: any) =>
    String(id)
  );
});

const groupMembers = computed(() => {
  const set = new Set(groupMemberIds.value);
  return players.items.filter((p) => set.has(String(p._id)));
});

watch(selectedGroup, async (gid) => {
  const set = new Set(groupMemberIds.value);
  selectedPlayers.value = selectedPlayers.value.filter((id) =>
    set.has(String(id))
  );

  items.value = [];
  if (gid) {
  const resp = await apiListByGroup(gid as UUID);
    meta.value = resp.meta;
    const list = resp.matches;
    items.value = [...list].sort((a, b) => {
      const da = new Date((a.scheduledAt ?? (a as any).createdAt) || 0).getTime();
      const db = new Date((b.scheduledAt ?? (b as any).createdAt) || 0).getTime();
      return db - da;
    });
  }
});

async function createMatch() {
  if (!selectedGroup.value || selectedPlayers.value.length < 2) return;

  const scheduledAt = when.value ? new Date(when.value).toISOString() : undefined;

  const m = await apiCreateMatch(
    selectedGroup.value as UUID,
    selectedPlayers.value,
    scheduledAt
  );

  items.value.unshift(m);
  highlights.value[m._id] = true;
  setTimeout(() => { delete highlights.value[m._id]; }, 600);
  selectedPlayers.value = [];
}

/** formateo con fallback por si hay partidos viejos sin scheduledAt */
function viewDate(m: Match) {
  const d: string | undefined =
    m.scheduledAt ?? (m as any).date ?? (m as any).createdAt;
  return d ? new Date(d).toLocaleString() : "Sin fecha";
}

async function removeMatch(id: UUID) {
  try {
  await apiDeleteMatch(id);
    items.value = items.value.filter((m) => m._id !== id);
  } catch (e) {
    console.error(e);
    alert("No se pudo eliminar el partido");
  }
}
</script>

<template>
  <CenteredLoader v-if="loading" label="Cargando partidos…" />
  <div v-else class="space-y-6">
    <div class="bg-white p-4 rounded-xl border space-y-3">
      <div class="grid md:grid-cols-[1fr,auto,auto] gap-3 items-center">
        <!-- Grupo -->
        <select v-model="selectedGroup" class="border rounded px-3 py-2">
          <option value="" disabled>Elegí un grupo</option>
          <option v-for="g in groups.items" :key="g._id" :value="g._id">
            {{ g.name }}
          </option>
        </select>

        <!-- Fecha (opcional) -->
        <input
          v-model="when"
          type="datetime-local"
          class="border rounded px-3 py-2"
        />

        <!-- Crear -->
        <button
          class="px-4 py-2 rounded text-white disabled:opacity-50"
          :class="meta?.canCreate ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'"
          :disabled="!selectedGroup || selectedPlayers.length < 2 || !meta?.canCreate"
          @click="createMatch"
          title="" :data-tip="!meta?.canCreate ? 'No tenés permiso para crear partidos en este grupo' : ''"
        >
          Crear partido
        </button>
      </div>

      <!-- Checkboxes de jugadores del grupo -->
      <div v-if="selectedGroup" class="flex flex-wrap gap-3">
        <label
          v-for="p in groupMembers"
          :key="p._id"
          class="inline-flex items-center gap-2 border rounded px-3 py-2"
        >
          <input type="checkbox" :value="p._id" v-model="selectedPlayers" />
          <span>{{ p.name }}</span>
        </label>
        <p v-if="groupMembers.length === 0" class="text-sm text-gray-500">
          Este grupo no tiene jugadores todavía.
        </p>
      </div>
      <p v-else class="text-sm text-gray-500">
        Elegí un grupo para ver sus jugadores.
      </p>
    </div>

    <!-- Listado de partidos con transición -->
    <TransitionGroup
      name="match"
      tag="div"
      class="space-y-3"
      appear
    >
      <div
        v-for="m in items"
        :key="m._id"
        :class="[
          'p-4 rounded-xl border shadow-sm transition-colors duration-700',
          m.status === 'finalized' ? 'bg-gray-200' : 'bg-white',
          highlights[m._id] && 'bg-green-100 ring-1 ring-green-300'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm opacity-60">
            {{ viewDate(m) }}
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="m.canEdit"
              type="button"
              @click="removeMatch(m._id as UUID)"
              class="inline-block px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 transition-colors"
            >
              Eliminar
            </button>
            <router-link
              :to="`/match/${m._id}?group=${selectedGroup}`"
              class="inline-block px-3 py-1.5 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 transition-colors"
            >
              Abrir
            </router-link>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.match-enter-from { opacity: 0; transform: translateY(8px) scale(.96); }
.match-enter-active { transition: all 220ms cubic-bezier(.4,0,.2,1); }
.match-leave-active { transition: all 200ms cubic-bezier(.4,0,.2,1); position: relative; }
.match-leave-to { opacity: 0; transform: translateX(-24px) scale(.94); }
.match-move { transition: transform 260ms cubic-bezier(.4,0,.2,1); }
</style>
