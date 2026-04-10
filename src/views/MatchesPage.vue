<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { t } from '@/localizations';
import CenteredLoader from '../components/CenteredLoader.vue';
import MatchCard from '../components/MatchCard.vue';
import AppSelect from '../components/AppSelect.vue';
import { useGroups } from "../stores/groups";
import { listByGroup as apiListByGroup, deleteMatch as apiDeleteMatch } from "../lib/matches.service";
import type { UUID, Match } from "../types";

const router = useRouter();
const groups = useGroups();
const loading = ref(true);

/**
 * Initial fetch for groups on mount.
 */
onMounted(async () => {
  loading.value = true;

  try {
    await groups.fetch();
  } finally {
    loading.value = false;
  }

  if (groups.items.length === 1) {
    selectedGroup.value = groups?.items[0]?._id ?? "";
  }
});

const selectedGroup = ref<UUID | "">("");
const items = ref<Match[]>([]);
const highlights = ref<Record<string, boolean>>({});

/**
 * React to group selection changes: fetch matches for the selected group.
 */
watch(selectedGroup, async (gid) => {
  items.value = [];
  if (gid) {
    const resp = await apiListByGroup(gid as UUID);
    const list = resp.matches;
    items.value = [...list].sort((a, b) => {
      const da = new Date((a.scheduledAt ?? (a as any).createdAt) || 0).getTime();
      const db = new Date((b.scheduledAt ?? (b as any).createdAt) || 0).getTime();
      return db - da;
    });
  }
});

/**
 * Delete match by id and remove from list; shows alert on failure.
 */
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
    <!-- Group selector and create button -->
    <div class="flex flex-wrap items-center gap-3">
      <AppSelect
        v-model="selectedGroup"
        :options="groups.items.map(g => ({ value: g._id, label: g.name }))"
        :placeholder="t('matches.chooseGroup')"
        class="flex-1 min-w-0"
      />

      <button class="btn-accent !w-auto px-4 py-2 text-sm shrink-0"
        @click="router.push({ name: 'create-match' })">
        + {{ t('matches.create') }}
      </button>
    </div>

    <!-- List of matches -->
    <TransitionGroup name="match" tag="div" class="space-y-3" appear>
      <h1 v-if="selectedGroup" class="text-2xl font-bold text-white">{{ t('matches.matchesTitle') }}</h1>

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
