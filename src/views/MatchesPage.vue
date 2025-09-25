<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useGroups } from "../stores/groups";
import { usePlayers } from "../stores/players";
import * as matchesApi from "../lib/matches.service";
import type { UUID, Match } from "../types";

const groups = useGroups();
const players = usePlayers();

onMounted(() => {
  groups.fetch();
  players.fetch();
});

/** valor local para datetime-local (evita el shift del toISOString()) */
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

/** IDs de miembros del grupo (tolera members | players) */
const groupMemberIds = computed<string[]>(() => {
  const g = groups.items.find((x) => x._id === selectedGroup.value);
  if (!g) return [];
  return ((g as any).members ?? (g as any).players ?? []).map((id: any) =>
    String(id)
  );
});

/** Jugadores filtrados por grupo seleccionado */
const groupMembers = computed(() => {
  const set = new Set(groupMemberIds.value);
  return players.items.filter((p) => set.has(String(p._id)));
});

/** Al cambiar de grupo: refresco lista y limpio selección */
watch(selectedGroup, async (gid) => {
  const set = new Set(groupMemberIds.value);
  selectedPlayers.value = selectedPlayers.value.filter((id) =>
    set.has(String(id))
  );

  items.value = [];
  if (gid) {
    const list = await matchesApi.listByGroup(gid as UUID);
    // opcional: orden por fecha programada (o createdAt)
    items.value = [...list].sort((a, b) => {
      const da = new Date((a.scheduledAt ?? (a as any).createdAt) || 0).getTime();
      const db = new Date((b.scheduledAt ?? (b as any).createdAt) || 0).getTime();
      return db - da;
    });
  }
});

async function createMatch() {
  if (!selectedGroup.value || selectedPlayers.value.length < 2) return;

  // el backend espera scheduledAt (ISO). Convertimos el valor local a ISO.
  const scheduledAt = when.value ? new Date(when.value).toISOString() : undefined;

  const m = await matchesApi.create(
    selectedGroup.value as UUID,
    selectedPlayers.value,
    scheduledAt
  );

  items.value.unshift(m);
  selectedPlayers.value = [];
}

/** formateo con fallback por si hay partidos viejos sin scheduledAt */
function viewDate(m: Match) {
  const d: string | undefined =
    m.scheduledAt ?? (m as any).date ?? (m as any).createdAt;
  return d ? new Date(d).toLocaleString() : "Sin fecha";
}
</script>

<template>
  <div class="space-y-6">
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
          class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          :disabled="!selectedGroup || selectedPlayers.length < 2"
          @click="createMatch"
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

    <!-- Listado de partidos -->
    <div v-for="m in items" :key="m._id" class="bg-white p-4 rounded-xl border">
      <div class="flex items-center justify-between">
        <div class="text-sm opacity-60">
          {{ viewDate(m) }}
        </div>
        <router-link
          :to="`/match/${m._id}?group=${selectedGroup}`"
          class="text-blue-600"
        >
          Abrir
        </router-link>
      </div>
    </div>
  </div>
</template>
