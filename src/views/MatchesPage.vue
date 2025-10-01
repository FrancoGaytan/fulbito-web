<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { t } from '@/localizations';
import CenteredLoader from '../components/CenteredLoader.vue';
import MatchCard from '../components/MatchCard.vue';
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


async function removeMatch(id: UUID) {
  try {
    await apiDeleteMatch(id);
    items.value = items.value.filter((m) => m._id !== id);
  } catch (e) {
    console.error(e);
    alert(t('matches.deleteError'));
  }
}
</script>

<template>
  <CenteredLoader v-if="loading" :label="t('matches.loading')" />
  <div v-else class="space-y-6">
    <div class="bg-white p-4 rounded-xl border space-y-3">
      <div class="grid md:grid-cols-[1fr,auto,auto] gap-3 items-center">
        <!-- Grupo -->
        <select v-model="selectedGroup" class="border rounded px-3 py-2">
          <option value="" disabled>{{ t('matches.chooseGroup') }}</option>
          <option v-for="g in groups.items" :key="g._id" :value="g._id">
            {{ g.name }}
          </option>
        </select>

        <!-- Fecha (opcional) -->
        <input v-model="when" type="datetime-local" class="border rounded px-3 py-2" />

        <!-- Crear -->
        <button class="px-4 py-2 rounded text-white disabled:opacity-50"
          :class="meta?.canCreate ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'"
          :disabled="!selectedGroup || selectedPlayers.length < 2 || !meta?.canCreate" @click="createMatch" title=""
          :data-tip="!meta?.canCreate ? 'No tenés permiso para crear partidos en este grupo' : ''">
          {{ t('matches.create') }}
        </button>
      </div>

      <!-- Checkboxes de jugadores del grupo -->
      <TransitionGroup name="groupMembers" tag="div" class="space-y-3" appear>
        <div v-if="selectedGroup" class="flex flex-wrap gap-3">
          <label v-for="p in groupMembers" :key="p._id" class="inline-flex items-center gap-2 border rounded px-3 py-2">
            <input type="checkbox" :value="p._id" v-model="selectedPlayers" />

            <span>{{ p.name }}</span>
          </label>

          <p v-if="groupMembers.length === 0" class="text-sm text-gray-500">{{ t('matches.groupNoPlayers') }}</p>
        </div>

        <p v-else class="text-sm text-gray-500">{{ t('matches.selectGroupSeePlayers') }}</p>
      </TransitionGroup>

    </div>

    <!-- Listado de partidos con transición -->
    <TransitionGroup name="match" tag="div" class="space-y-3" appear>
      <h1 v-if="selectedGroup" class="text-2xl font-semibold">{{ t('matches.matchesTitle') }}</h1>

      <MatchCard v-for="m in items" :key="m._id" :match="m" :highlight="highlights[m._id]"
        :selected-group="selectedGroup" :can-delete="true" @remove="removeMatch" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.match-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(.96);
}

.match-enter-active {
  transition: all 220ms cubic-bezier(.4, 0, .2, 1);
}

.match-leave-active {
  transition: all 200ms cubic-bezier(.4, 0, .2, 1);
  position: relative;
}

.match-leave-to {
  opacity: 0;
  transform: translateX(-24px) scale(.94);
}

.match-move {
  transition: transform 260ms cubic-bezier(.4, 0, .2, 1);
}
</style>
