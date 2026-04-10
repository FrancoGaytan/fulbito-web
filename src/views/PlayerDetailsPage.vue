<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { t } from '@/localizations'
import CenteredLoader from '../components/CenteredLoader.vue'
import { useRoute, useRouter } from 'vue-router'
import { abilityKeys, abilityLabels, type AbilityKey } from '../constants/abilities'
import { getPlayer, updatePlayerSkills, getPlayerEloHistory, type EloHistoryPoint } from '../lib/players.service'
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
const eloHistory = ref<EloHistoryPoint[]>([])

type ChartPoints = {
  coords: { x: number; y: number }[]
  path: string
  fillPath: string
  last: { x: number; y: number }
  lastVal: number
  minV: number
  maxV: number
  W: number
  H: number
}

const chartPoints = computed<ChartPoints | null>(() => {
  const pts = eloHistory.value.filter(p => p.after !== null)
  if (pts.length < 2) return null
  const values = pts.map(p => p.after as number)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const pad = 8
  const W = 280
  const H = 80
  const range = maxV - minV || 1
  const coords: { x: number; y: number }[] = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - minV) / range) * (H - pad * 2),
  }))
  const path = coords.map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`)).join(' ')
  const firstX = coords[0]!.x
  const lastPt = coords[coords.length - 1]!
  const fillPath = `${path} L${lastPt.x},${H} L${firstX},${H} Z`
  const last = lastPt
  const lastVal = values[values.length - 1]!
  return { coords, path, fillPath, last, lastVal, minV, maxV, W, H }
})

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
    try {
      eloHistory.value = await getPlayerEloHistory(id)
    } catch { /* historial no crítico */ }
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

// -------- Stats Computed --------
const stats = computed(() => player.value?.stats)
const hasStats = computed(() => !!stats.value && typeof stats.value.total === 'number')
const winRate = computed(() => {
  if (!stats.value || !stats.value.total) return 0
  return +(100 * (stats.value.wins / stats.value.total)).toFixed(1)
})
function pct(part: number, total: number) {
  if (!total) return 0
  return +(100 * (part / total)).toFixed(2)
}
const winsPct = computed(() => pct(stats.value?.wins || 0, stats.value?.total || 0))
const drawsPct = computed(() => pct(stats.value?.draws || 0, stats.value?.total || 0))
const lossesPct = computed(() => pct(stats.value?.losses || 0, stats.value?.total || 0))

function clamp(n: number) { return Math.max(0, Math.min(10, Math.round(n || 0))) }

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
      <button @click="router.back()" class="text-sm text-gray-400 hover:text-white flex transition">{{ t('playerDetail.back') }}</button>
      <h1 class="text-2xl font-bold text-white">{{ t('playerDetail.title') }}</h1>
    </div>

    <div v-if="error" class="text-sm text-red-400 whitespace-pre-line">{{ error }}</div>
    <div v-else-if="player" class="space-y-6">
      <!-- Profile card -->
      <div class="card p-5 space-y-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-dark-600 border border-dark-500/50 flex items-center justify-center text-accent font-bold text-xl shrink-0">
            {{ player.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl font-bold text-white">{{ player.name }}</h2>
              <span v-if="player.nickname" class="text-gray-500">@{{ player.nickname }}</span>
            </div>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span v-if="player.userId === currentUserId" class="badge-green">{{ t('playerDetail.myProfile') }}</span>
              <span v-else-if="player.userId" class="badge-gray">{{ t('playerDetail.claimed') }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-dark-800 rounded-xl p-3 text-center">
            <div class="text-xs text-gray-500 uppercase tracking-wide">Partidos</div>
            <div class="text-lg font-bold text-white mt-1">{{ player.gamesPlayed ?? 0 }}</div>
          </div>
          <div class="bg-dark-800 rounded-xl p-3 text-center" v-if="player.rating !== undefined">
            <div class="text-xs text-gray-500 uppercase tracking-wide">Rating</div>
            <div class="text-lg font-bold text-accent mt-1">{{ player.rating }}</div>
          </div>
        </div>

        <div class="flex gap-4 text-xs text-gray-500">
          <span v-if="player.createdAt">{{ t('playerDetail.createdAt') }} {{ new Date(player.createdAt).toLocaleDateString() }}</span>
          <span v-if="player.updatedAt">{{ t('playerDetail.updatedAt') }} {{ new Date(player.updatedAt).toLocaleDateString() }}</span>
        </div>

        <!-- Stats Section -->
        <div class="pt-4 border-t border-dark-500/30 space-y-3" v-if="hasStats">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h3 class="section-label">{{ t('playerDetail.statsTitle') }}</h3>
            <div v-if="stats?.total" class="text-xs text-gray-400">{{ t('playerDetail.winRate') }}: <strong class="text-accent">{{ winRate }}%</strong></div>
          </div>
          <div v-if="stats?.error" class="text-xs text-red-400">⚠️ {{ t('playerDetail.statsError') }}</div>
          <div v-else-if="!stats?.total" class="text-xs text-gray-500">{{ t('playerDetail.noStatsYet') }}</div>
          <template v-else>
            <div class="space-y-1">
              <div class="h-2 w-full bg-dark-600 rounded-full overflow-hidden flex">
                <div v-if="winsPct" :style="{width: winsPct + '%'}" class="bg-accent transition-all"></div>
                <div v-if="drawsPct" :style="{width: drawsPct + '%'}" class="bg-gray-500 transition-all"></div>
                <div v-if="lossesPct" :style="{width: lossesPct + '%'}" class="bg-red-500 transition-all"></div>
              </div>
              <div class="flex justify-between text-[10px] uppercase tracking-wide text-gray-500">
                <span class="text-accent">{{ t('playerDetail.wins') }} {{ stats?.wins }}</span>
                <span>{{ t('playerDetail.draws') }} {{ stats?.draws }}</span>
                <span class="text-red-400">{{ t('playerDetail.losses') }} {{ stats?.losses }}</span>
                <span>{{ t('playerDetail.total') }} {{ stats?.total }}</span>
              </div>
            </div>
            <div class="text-xs text-gray-400">
              {{ t('playerDetail.record') }}: <strong class="text-white">{{ stats?.wins }}-{{ stats?.draws }}-{{ stats?.losses }}</strong>
              <span class="ml-2 text-gray-500">({{ winRate }}% WR)</span>
            </div>
          </template>
        </div>
      </div>

      <!-- ELO History chart -->
      <div v-if="chartPoints" class="card p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="section-label">Progresión ELO</h3>
          <span class="text-xs text-gray-500">{{ eloHistory.length }} partidos</span>
        </div>
        <div class="relative w-full" style="height:96px">
          <svg :viewBox="`0 0 ${chartPoints.W} ${chartPoints.H}`" class="w-full h-full" preserveAspectRatio="none">
            <!-- Fill area -->
            <defs>
              <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22C55E" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#22C55E" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path :d="chartPoints.fillPath" fill="url(#eloGrad)"/>
            <!-- Line -->
            <path :d="chartPoints.path" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Last point dot -->
            <circle :cx="chartPoints.last.x" :cy="chartPoints.last.y" r="3" fill="#22C55E"/>
          </svg>
          <!-- Min / Max labels -->
          <span class="absolute bottom-0 left-0 text-[9px] text-gray-600 tabular-nums">{{ chartPoints.minV }}</span>
          <span class="absolute top-0 left-0 text-[9px] text-gray-600 tabular-nums">{{ chartPoints.maxV }}</span>
          <span class="absolute top-[-8px] right-0 text-xs font-bold text-accent tabular-nums">{{ chartPoints.lastVal }}</span>
        </div>
      </div>

      <!-- Abilities card -->
      <div class="card p-5 space-y-4">
        <div class="flex items-center gap-3">
          <h2 class="font-bold text-white uppercase tracking-wide text-sm">{{ t('playerDetail.skills') }}</h2>
          <span v-if="!canEdit" class="text-xs text-gray-500">{{ t('playerDetail.onlyOwner') }}</span>
        </div>

        <div class="space-y-4">
          <div v-for="k in abilityKeys" :key="k" class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-sm text-gray-300 font-medium">{{ abilityLabels[k] }}</label>
              <span class="text-sm font-bold text-accent tabular-nums">{{ editAbilities[k] }}</span>
            </div>
            <input
              type="range" min="0" max="10" step="1"
              v-model.number="editAbilities[k]"
              :disabled="!canEdit"
              class="w-full accent-accent h-1.5 bg-dark-500 rounded-full appearance-none cursor-pointer disabled:opacity-50
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,197,94,0.5)]"
            />
          </div>
        </div>

        <p class="text-xs text-gray-500">{{ t('playerDetail.zeroHint') }}</p>
        <div class="pt-3 border-t border-dark-500/30" v-if="canEdit">
          <button @click="saveSkills" :disabled="saving" class="btn-accent">{{ saving ? t('playerDetail.saving') : t('playerDetail.save') }}</button>
        </div>
        <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>