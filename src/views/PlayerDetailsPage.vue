<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { t } from '@/localizations'
import CenteredLoader from '../components/CenteredLoader.vue'
import { useRoute, useRouter } from 'vue-router'
import { abilityKeys, abilityLabels, type AbilityKey } from '../constants/abilities'
import { getPlayer, updatePlayerSkills } from '../lib/players.service'
import { usePlayers } from '../stores/players'
import type { Player } from '../types'
import { localStorageKeys } from '../utils/localStorageKeys'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const player = ref<Player | null>(null)
const playersStore = usePlayers()

const currentUserId = computed(() => {
  try {
    const token = localStorage.getItem(localStorageKeys.token)
    if (!token) return ''
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return payload.sub || payload.userId || payload.id || ''
  } catch { return '' }
})

const canEdit = computed(() => !!player.value && player.value.userId === currentUserId.value)

const editAbilities = reactive<Record<AbilityKey, number>>({} as any)

function loadEditableAbilities(p: Player) {
  for (const k of abilityKeys) {
    const v = (p.abilities || {})[k as AbilityKey]
    editAbilities[k as AbilityKey] = typeof v === 'number' ? v : 0
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const p = await getPlayer(id)
    player.value = p
    loadEditableAbilities(p)
  } catch (e: any) {
    const local = playersStore.items.find(p => p._id === id)
    if (local) {
      player.value = local as any
      loadEditableAbilities(local as any)
      error.value = (e?.message || t('playerDetail.refreshFallback')) + '\n' + t('playerDetail.showingLocal')
    } else {
      error.value = e?.message || t('playerDetail.loadError')
    }
  } finally {
    loading.value = false
  }
})

function clamp(n: number) { return Math.max(0, Math.min(10, Math.round(n || 0))) }
function inc(k: AbilityKey) { editAbilities[k] = clamp(editAbilities[k] + 1) }
function dec(k: AbilityKey) { editAbilities[k] = clamp(editAbilities[k] - 1) }
function normalize(k: AbilityKey) { editAbilities[k] = clamp(editAbilities[k]) }

async function saveSkills() {
  if (!player.value) return
  saving.value = true
  error.value = null
  try {
    const payload: Partial<Record<AbilityKey, number>> = {}
    for (const k of abilityKeys) {
      const v = clamp(editAbilities[k])
      if (v > 0) payload[k] = v
    }
    const updated = await updatePlayerSkills(player.value._id, payload)
    player.value = updated
    loadEditableAbilities(updated)
  } catch (e: any) {
  error.value = e?.message || t('playerDetail.saveError')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <CenteredLoader v-if="loading" :label="t('playerDetail.loading')" />
  <div v-else class="space-y-6">
    <div class="flex flex-col gap-3">
  <button @click="router.back()" class="text-sm text-gray-600 hover:text-black flex">{{ t('playerDetail.back') }}</button>
  <h1 class="text-2xl font-semibold">{{ t('playerDetail.title') }}</h1>
    </div>

    <div v-if="error" class="text-sm text-red-600 whitespace-pre-line">{{ error }}</div>
    <div v-else-if="player" class="space-y-6">
      <div class="bg-white p-5 rounded-xl shadow border space-y-2">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="text-xl font-medium">{{ player.name }}</h2>
          <span v-if="player.nickname" class="text-gray-500">@{{ player.nickname }}</span>
          <span v-if="player.userId === currentUserId" class="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded">{{ t('playerDetail.myProfile') }}</span>
          <span v-else-if="player.userId" class="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{{ t('playerDetail.claimed') }}</span>
        </div>
  <div class="text-sm">{{ t('playerDetail.gamesPlayed') }} <strong>{{ player.gamesPlayed ?? 0 }}</strong></div>
  <div class="text-sm" v-if="player.rating !== undefined">{{ t('playerDetail.rating') }} <strong>{{ player.rating }}</strong></div>
  <div class="text-xs text-gray-400" v-if="player.createdAt">{{ t('playerDetail.createdAt') }} {{ new Date(player.createdAt).toLocaleString() }}</div>
  <div class="text-xs text-gray-400" v-if="player.updatedAt">{{ t('playerDetail.updatedAt') }} {{ new Date(player.updatedAt).toLocaleString() }}</div>
      </div>

      <!-- Habilidades -->
      <div class="bg-white p-5 rounded-xl shadow border space-y-4">
        <div class="flex items-center gap-3">
          <h2 class="font-medium">{{ t('playerDetail.skills') }}</h2>
          <span v-if="!canEdit" class="text-xs text-gray-500">{{ t('playerDetail.onlyOwner') }}</span>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div v-for="k in abilityKeys.slice(0, Math.ceil(abilityKeys.length/2))" :key="k" class="flex flex-wrap items-center gap-2 sm:gap-3">
              <label class="flex-1 min-w-[110px] sm:w-48 text-sm text-gray-700 font-medium truncate">{{ abilityLabels[k] }}</label>
              <div class="flex items-center gap-1 sm:gap-2 shrink-0">
                <button type="button" class="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 active:scale-95" :disabled="!canEdit" @click="dec(k)">−</button>
                <input type="number" min="0" max="10" step="1" v-model.number="editAbilities[k]" @change="normalize(k)" :disabled="!canEdit" class="w-14 sm:w-16 border rounded px-2 py-1 text-center" />
                <button type="button" class="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 active:scale-95" :disabled="!canEdit" @click="inc(k)">+</button>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="k in abilityKeys.slice(Math.ceil(abilityKeys.length/2))" :key="k" class="flex flex-wrap items-center gap-2 sm:gap-3">
              <label class="flex-1 min-w-[110px] sm:w-48 text-sm text-gray-700 font-medium truncate">{{ abilityLabels[k] }}</label>
              <div class="flex items-center gap-1 sm:gap-2 shrink-0">
                <button type="button" class="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 active:scale-95" :disabled="!canEdit" @click="dec(k)">−</button>
                <input type="number" min="0" max="10" step="1" v-model.number="editAbilities[k]" @change="normalize(k)" :disabled="!canEdit" class="w-14 sm:w-16 border rounded px-2 py-1 text-center" />
                <button type="button" class="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 active:scale-95" :disabled="!canEdit" @click="inc(k)">+</button>
              </div>
            </div>
          </div>
        </div>
  <p class="text-xs text-gray-500">{{ t('playerDetail.zeroHint') }}</p>
        <div class="pt-2 border-t" v-if="canEdit">
          <button @click="saveSkills" :disabled="saving" class="px-4 py-2 rounded bg-black text-white disabled:opacity-50">{{ saving ? t('playerDetail.saving') : t('playerDetail.save') }}</button>
        </div>
        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>