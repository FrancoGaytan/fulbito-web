<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useGroups } from "../stores/groups";
import { usePlayers } from "../stores/players";
import * as groupsApi from "../lib/groups.service";
import type { UUID } from "../types";

const groups = useGroups();
const players = usePlayers();

onMounted(() => {
  groups.fetch();
  players.fetch();
});

/** ---------- Crear grupo ---------- */
const gName = ref("");
const gDesc = ref("");
const creating = ref(false);

function memberIdsFromAny(g: any): string[] {
  return ((g?.members ?? g?.players ?? []) as string[]).map(String);
}

async function createNewGroup() {
  const name = gName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    const g = await groupsApi.createGroup(name, gDesc.value);
    // normalizo members/players
    const normalized = { ...g, members: memberIdsFromAny(g) } as any;
    groups.items.unshift(normalized);
    // reset, dejo abierto el panel de ese grupo para sumar players
    gName.value = "";
    gDesc.value = "";
    openPanel(normalized._id);
  } finally {
    creating.value = false;
  }
}

/** ---------- Panel agregar jugadores ---------- */
const panelFor = ref<UUID | "">(""); // groupId con panel abierto
const search = ref(""); // filtro de búsqueda
const selected = ref<UUID[]>([]); // ids seleccionados en el panel

const activeGroup = computed(
  () => groups.items.find((g) => g._id === panelFor.value) ?? null
);

const nameById = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {};
  for (const p of players.items) m[p._id] = p.name;
  return m;
});

// Jugadores disponibles = no están en el grupo activo
const available = computed(() => {
  const g = activeGroup.value;
  if (!g) return [];
  const memberSet = new Set(memberIdsFromAny(g));
  return players.items.filter((p) => !memberSet.has(String(p._id)));
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return q
    ? available.value.filter((p) => p.name.toLowerCase().includes(q))
    : available.value;
});

function openPanel(groupId: UUID) {
  panelFor.value = groupId;
  search.value = "";
  selected.value = [];
}

async function addSelected() {
  if (!activeGroup.value || selected.value.length === 0) return;
  await groupsApi.addPlayersToGroup(activeGroup.value._id, selected.value);
  // Optimista: actualizo members localmente (soporta members/players)
  const current = memberIdsFromAny(activeGroup.value);
  const next = Array.from(new Set([...current, ...selected.value]));
  (activeGroup.value as any).members = next;
  selected.value = [];
  search.value = "";
}
</script>

<template>
  <!-- Crear grupo -->
  <div class="bg-white border rounded-xl p-4 mb-6">
    <h2 class="text-lg font-semibold mb-3">Crear grupo</h2>
    <div class="grid md:grid-cols-3 gap-3">
      <input
        v-model="gName"
        type="text"
        placeholder="Nombre del grupo"
        class="border rounded px-3 py-2 w-full"
      />
      <input
        v-model="gDesc"
        type="text"
        placeholder="Descripción (opcional)"
        class="border rounded px-3 py-2 w-full"
      />
      <button
        class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        :disabled="!gName.trim() || creating"
        @click="createNewGroup"
      >
        {{ creating ? "Creando…" : "Crear grupo" }}
      </button>
    </div>
  </div>

  <!-- Grupos + panel agregar jugadores -->
  <div class="grid md:grid-cols-2 gap-4">
    <div
      v-for="g in groups.items"
      :key="g._id"
      class="bg-white border rounded-xl p-4 space-y-3"
    >
      <div class="flex items-center gap-3">
        <h2 class="font-medium text-lg">{{ g.name }}</h2>
        <span class="ml-auto text-sm text-gray-500">
          {{ memberIdsFromAny(g).length }} jugadores
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="pid in memberIdsFromAny(g)"
          :key="pid"
          class="text-xs rounded-full bg-gray-100 border px-2 py-0.5"
        >
          {{ nameById[pid] || pid }}
        </span>
      </div>

      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded bg-black text-white"
          @click="openPanel(g._id)"
        >
          Agregar jugadores
        </button>
      </div>

      <!-- Panel inline -->
      <div v-if="panelFor === g._id" class="mt-3 border-t pt-3 space-y-3">
        <div class="flex items-center gap-2">
          <input
            v-model="search"
            type="text"
            placeholder="Buscar jugador…"
            class="border rounded px-3 py-2 w-full"
          />
          <button
            class="px-2 py-2 text-xs border rounded leading-none"
            @click="selected = filtered.map((p) => p._id as UUID)"
          >
            Seleccionar todo
          </button>
        </div>

        <div class="max-h-64 overflow-auto grid md:grid-cols-2 gap-2">
          <label
            v-for="p in filtered"
            :key="p._id"
            class="flex items-center gap-2 border rounded px-3 py-2"
          >
            <input type="checkbox" :value="p._id" v-model="selected" />
            <span>{{ p.name }}</span>
          </label>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            :disabled="selected.length === 0"
            @click="addSelected"
          >
            Agregar {{ selected.length }}
          </button>
          <button class="px-3 py-2 border rounded" @click="panelFor = ''">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
