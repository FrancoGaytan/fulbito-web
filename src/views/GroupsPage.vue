<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { t } from "@/localizations";
import CenteredLoader from "../components/CenteredLoader.vue";
import GroupCard from "../components/GroupCard.vue";
import { useGroups } from "../stores/groups";
import { useGroupContext } from "../stores/groupContext";
import { usePlayers } from "../stores/players";
import * as groupsApi from "../lib/groups.service";
import type { UUID } from "../types";

const groups = useGroups();
const players = usePlayers();
const loading = ref(true);
const ctx = useGroupContext();

/**
 * Fetch groups & players in parallel for initial render.
 * @returns {Promise<void>}
 */
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([groups.fetch(), players.fetch()]);
  } finally {
    loading.value = false;
  }
});

const gName = ref("");
const gDesc = ref("");
const creating = ref(false);

/**
 * Normalize group membership array bridging members vs players legacy fields.
 * @param {any} g Raw group object returned by API.
 * @returns {string[]} Array of member player IDs (stringified).
 */
function memberIdsFromAny(g: any): string[] {
  return ((g?.members ?? g?.players ?? []) as string[]).map(String);
}

/**
 * Create a new group then open its add-players panel.
 * Uses name/description refs; resets on success.
 * @returns {Promise<void>}
 */
async function createNewGroup() {
  const name = gName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    const g = await groupsApi.createGroup(name, gDesc.value);
    const normalized = { ...g, members: memberIdsFromAny(g) } as any;
    groups.items.unshift(normalized);

    gName.value = "";
    gDesc.value = "";
    openPanel(normalized._id);
  } finally {
    creating.value = false;
  }
}

const panelFor = ref<UUID | "">("");
const search = ref("");
const selected = ref<UUID[]>([]);

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

/**
 * Open group panel and reset selection & search state.
 * @param {UUID} groupId Group identifier.
 * @returns {void}
 */
function openPanel(groupId: UUID) {
  panelFor.value = groupId;
  search.value = "";
  selected.value = [];
}

/**
 * Persist selected players into active group via API call.
 * Clears filter + selection after update.
 * @returns {Promise<void>}
 */
async function addSelected() {
  if (!activeGroup.value || selected.value.length === 0) return;
  await groupsApi.addPlayersToGroup(activeGroup.value._id, selected.value);
  const current = memberIdsFromAny(activeGroup.value);
  const next = Array.from(new Set([...current, ...selected.value]));
  (activeGroup.value as any).members = next;
  selected.value = [];
  search.value = "";
}

/**
 * Delete group and close panel if it was active.
 * @param {UUID} id Group identifier to remove.
 * @returns {Promise<void>}
 */
async function removeGroup(id: UUID) {
  try {
    await groupsApi.deleteGroup(id);
    groups.items = groups.items.filter((g) => g._id !== id);
    if (panelFor.value === id) panelFor.value = "";
  } catch (e) {
    console.error(e);
    alert(t("groups.deleteError"));
  }
}
// Filtrado por espacio (ctx.activeGroupId) mostrando sólo el grupo seleccionado si coincide
const displayedGroups = computed(() => {
  if (!ctx.activeGroupId) return groups.items;
  return groups.items.filter(g => g._id === ctx.activeGroupId);
});

</script>

<template>
  <CenteredLoader v-if="loading" :label="t('groups.loading')" />
  <template v-else>
    <!-- Crear grupo -->
    <div class="bg-white border rounded-xl p-4 mb-6">
      <h2 class="text-lg font-semibold mb-3">{{ t("groups.createTitle") }}</h2>
      <div class="grid md:grid-cols-3 gap-3">
        <input
          v-model="gName"
          type="text"
          :placeholder="t('groups.namePlaceholder')"
          class="border rounded px-3 py-2 w-full"
        />
        <input
          v-model="gDesc"
          type="text"
          :placeholder="t('groups.descPlaceholder')"
          class="border rounded px-3 py-2 w-full"
        />
        <button
          class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          :disabled="!gName.trim() || creating"
          @click="createNewGroup"
        >
          {{ creating ? t("groups.creating") : t("groups.create") }}
        </button>
      </div>
    </div>

    <!-- Grupos + panel agregar jugadores -->
    <TransitionGroup name="group" tag="div" class="grid md:grid-cols-2 gap-4" appear>
      <GroupCard
        v-for="g in displayedGroups"
        :key="g._id"
        :group="g"
        :is-open="panelFor === g._id"
        :member-ids="memberIdsFromAny(g)"
        :name-by-id="nameById"
        :filtered="filtered"
        :selected="selected"
        :search="search"
        @open="openPanel"
        @close="panelFor = ''"
        @update:search="(v)=> search = v"
        @update:selected="(v)=> selected = v"
        @add-selected="addSelected"
        @remove="removeGroup"
        @select-all="selected = filtered.map(p=> p._id as UUID)"
      />
    </TransitionGroup>
    <p v-if="ctx.activeGroupId && displayedGroups.length===0" class="text-xs text-gray-500 mt-2">{{ t('groups.noGroupsInSpace') }}</p>
  </template>
</template>

<style scoped>
.group-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
.group-enter-active {
  transition: all 230ms cubic-bezier(0.4, 0, 0.2, 1);
}
.group-leave-active {
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.group-leave-to {
  opacity: 0;
  transform: scale(0.92) translateX(-20px);
}
.group-move {
  transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
