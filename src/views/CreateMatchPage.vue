<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { t } from '@/localizations';
import CenteredLoader from '../components/CenteredLoader.vue';
import { useGroups } from "../stores/groups";
import { usePlayers } from "../stores/players";
import { listByGroup as apiListByGroup, create as apiCreateMatch } from "../lib/matches.service";
import type { UUID, MatchesGroupResponse } from "../types";

const router = useRouter();
const groups = useGroups();
const players = usePlayers();
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([groups.fetch(), players.fetch()]);
  } finally { loading.value = false; }

  if (groups.items.length === 1) {
    selectedGroup.value = groups?.items[0]?._id ?? "";
  }
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
const meta = ref<MatchesGroupResponse['meta'] | null>(null);

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

async function onGroupChange() {
  const set = new Set(groupMemberIds.value);
  selectedPlayers.value = selectedPlayers.value.filter((id) => set.has(String(id)));

  if (selectedGroup.value) {
    const resp = await apiListByGroup(selectedGroup.value as UUID);
    meta.value = resp.meta;
  } else {
    meta.value = null;
  }
}

async function createMatch() {
  if (!selectedGroup.value || selectedPlayers.value.length < 2) return;

  const scheduledAt = when.value ? new Date(when.value).toISOString() : undefined;

  await apiCreateMatch(
    selectedGroup.value as UUID,
    selectedPlayers.value,
    scheduledAt
  );

  router.push({ name: 'matches' });
}
</script>

<template>
  <CenteredLoader v-if="loading" :label="t('matches.loading')" />
  <div v-else class="space-y-6">
    <div class="flex items-center gap-3">
      <button @click="router.back()" class="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
        ← {{ t('matches.backToList') }}
      </button>
    </div>

    <h1 class="text-2xl font-semibold">{{ t('matches.create') }}</h1>

    <div class="bg-white p-4 rounded-xl border space-y-4">
      <!-- Group + Date + Create Button -->
      <div class="grid md:grid-cols-[1fr,auto,auto] gap-3 items-center">
        <select v-model="selectedGroup" @change="onGroupChange" class="border rounded px-3 py-2">
          <option value="" disabled>{{ t('matches.chooseGroup') }}</option>
          <option v-for="g in groups.items" :key="g._id" :value="g._id">
            {{ g.name }}
          </option>
        </select>

        <input v-model="when" type="datetime-local" class="border rounded px-3 py-2" />

        <button
          class="px-4 py-2 rounded text-white disabled:opacity-50"
          :class="meta?.canCreate ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'"
          :disabled="!selectedGroup || selectedPlayers.length < 2 || !meta?.canCreate"
          :title="!meta?.canCreate ? t('matches.noPermissionCreate') : ''"
          @click="createMatch">
          {{ t('matches.create') }}
        </button>
      </div>

      <!-- Player checkboxes -->
      <TransitionGroup name="groupMembers" tag="div" class="space-y-3" appear>
        <div v-if="selectedGroup" class="flex flex-wrap gap-3">
          <label
            v-for="p in groupMembers"
            :key="p._id"
            class="inline-flex items-center gap-2 border rounded px-3 py-2 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" :value="p._id" v-model="selectedPlayers" />
            <span>{{ p.name }}</span>
          </label>

          <p v-if="groupMembers.length === 0" class="text-sm text-gray-500">
            {{ t('matches.groupNoPlayers') }}
          </p>
        </div>

        <p v-else class="text-sm text-gray-500">{{ t('matches.selectGroupSeePlayers') }}</p>
      </TransitionGroup>
    </div>
  </div>
</template>
