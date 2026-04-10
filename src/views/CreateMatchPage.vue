<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { t } from '@/localizations';
import CenteredLoader from '../components/CenteredLoader.vue';
import AppSelect from '../components/AppSelect.vue';
import AppDateTimePicker from '../components/AppDateTimePicker.vue';
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
      <button @click="router.back()" class="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition">
        ← {{ t('matches.backToList') }}
      </button>
    </div>

    <div>
      <h1 class="text-2xl font-bold text-white">Nuevo Partido</h1>
      <p class="section-label mt-1">CONFIGURACIÓN DEL ENCUENTRO</p>
    </div>

    <div class="card p-5 space-y-5">
      <!-- Group selector -->
      <div class="space-y-2">
        <label class="section-label">SELECCIONAR GRUPO</label>
        <AppSelect
          v-model="selectedGroup"
          :options="groups.items.map(g => ({ value: g._id, label: g.name }))"
          :placeholder="t('matches.chooseGroup')"
          @change="onGroupChange"
        />
      </div>

      <!-- Date + Time -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="section-label">FECHA</label>
          <AppDateTimePicker v-model="when" />
        </div>
        <div class="space-y-2">
          <label class="section-label">JUGADORES</label>
          <div class="input-dark text-center font-bold text-accent">{{ selectedPlayers.length }} seleccionados</div>
        </div>
      </div>

      <!-- Player checkboxes -->
      <TransitionGroup name="groupMembers" tag="div" class="space-y-3" appear>
        <div v-if="selectedGroup">
          <label class="section-label mb-3 block">CONVOCATORIA DE JUGADORES</label>
          <div class="space-y-2 max-h-64 overflow-auto pr-1">
            <label
              v-for="p in groupMembers"
              :key="p._id"
              :class="[
                'flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all border',
                selectedPlayers.includes(p._id)
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-dark-800 border-dark-500/30 hover:border-dark-500/60'
              ]"
            >
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-dark-600 text-xs font-bold text-accent shrink-0">
                {{ p.name.charAt(0).toUpperCase() }}
              </div>
              <span class="flex-1 text-sm font-medium text-white">{{ p.name }}</span>
              <div :class="[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                selectedPlayers.includes(p._id)
                  ? 'border-accent bg-accent'
                  : 'border-dark-500'
              ]">
                <svg v-if="selectedPlayers.includes(p._id)" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <input type="checkbox" :value="p._id" v-model="selectedPlayers" class="sr-only" />
            </label>

            <p v-if="groupMembers.length === 0" class="text-sm text-gray-500">
              {{ t('matches.groupNoPlayers') }}
            </p>
          </div>
        </div>

        <p v-else class="text-sm text-gray-500">{{ t('matches.selectGroupSeePlayers') }}</p>
      </TransitionGroup>

      <!-- Create button -->
      <button
        class="btn-accent"
        :disabled="!selectedGroup || selectedPlayers.length < 2 || !meta?.canCreate"
        :title="!meta?.canCreate ? t('matches.noPermissionCreate') : ''"
        @click="createMatch">
        {{ t('matches.create') }}
      </button>
    </div>
  </div>
</template>
