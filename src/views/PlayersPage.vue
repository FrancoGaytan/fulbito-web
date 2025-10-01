<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { t } from '@/localizations'
import CenteredLoader from '../components/CenteredLoader.vue'
import { localStorageKeys } from '../utils/localStorageKeys'
import { useRouter } from 'vue-router'
import { abilityKeys, abilityLabels, type AbilityKey } from '../constants/abilities'
import * as playersApi from '../lib/players.service'
import { usePlayers } from '../stores/players'
import { useGroups } from '../stores/groups'

const players = usePlayers()
const router = useRouter()
const groups = useGroups()
const loading = ref(true)

const name = ref('')
const nickname = ref('')

const half = Math.ceil(abilityKeys.length / 2)
const leftKeys  = abilityKeys.slice(0, half)
const rightKeys = abilityKeys.slice(half)

const abilityScores = reactive<Record<AbilityKey, number>>(
  Object.fromEntries(abilityKeys.map(k => [k, 0])) as Record<AbilityKey, number>
)

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n || 0)))
function inc(key: AbilityKey) { abilityScores[key] = clamp((abilityScores[key] ?? 0) + 1) }
function dec(key: AbilityKey) { abilityScores[key] = clamp((abilityScores[key] ?? 0) - 1) }
function normalize(key: AbilityKey) { abilityScores[key] = clamp(abilityScores[key]) }

async function createPlayer() {
  if (!name.value.trim()) return
  const payload: Partial<Record<AbilityKey, number>> = {}
  for (const k of abilityKeys) {
    const v = clamp(abilityScores[k])
    if (v > 0) payload[k] = v
  }
  const p = await playersApi.createPlayer(name.value, nickname.value || undefined, payload)
  players.items.push(p)

  name.value = ''
  nickname.value = ''
  abilityKeys.forEach(k => (abilityScores[k] = 0))
}

const allPlayers = ref(players.items)
onMounted(async () => {
  loading.value = true
  try {
    await groups.fetch()
    allPlayers.value = await playersApi.listAllPlayers()
    players.items = allPlayers.value
  } finally { loading.value = false }
})

const currentUserId = computed(() => {
  try {
    const token = localStorage.getItem(localStorageKeys.token)
    if (!token) return ''
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return payload.sub || payload.userId || payload.id || ''
  } catch { return '' }
})

const myClaimedPlayerId = computed(() => players.items.find(p => p.userId && p.userId === currentUserId.value)?._id || '')


async function claim(p: any) {
  if (p.userId) return
  try {
    const updated = await playersApi.claimPlayer(p._id)
    const idx = players.items.findIndex(x => x._id === p._id)
    if (idx >= 0) players.items[idx] = updated
  } catch (e: any) {
  alert(e?.message || t('players.claimError'))
  }
}

async function unclaim(p: any) {
  try {
    const updated = await playersApi.unclaimPlayer(p._id)
    const idx = players.items.findIndex(x => x._id === p._id)
    if (idx >= 0) players.items[idx] = updated
  } catch (e: any) {
  alert(e?.message || t('players.unclaimError'))
  }
}

async function removePlayer(id: string) {
  try {
    await playersApi.deletePlayer(id)
    players.items = players.items.filter(p => p._id !== id)
  } catch (e) {
    console.error(e)
  alert(t('players.deleteError'))
  }
}
</script>

<template>
<CenteredLoader v-if="loading" :label="t('players.loading')" />
<div v-else class="space-y-6">
  <h1 class="text-2xl font-semibold">{{ t('players.title') }}</h1>

  <div class="bg-white p-4 rounded-xl shadow border space-y-4">
  <h2 class="font-medium">{{ t('players.createTitle') }}</h2>

    <div class="grid md:grid-cols-3 gap-3">
  <input v-model="name" :placeholder="t('players.name')" class="border rounded px-3 py-2" />
  <input v-model="nickname" :placeholder="t('players.nickname')" class="border rounded px-3 py-2" />
  <button @click="createPlayer" class="px-4 py-2 rounded bg-black text-white">{{ t('players.create') }}</button>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
  <!-- Columna izquierda -->
  <div class="space-y-3">
    <div v-for="a in leftKeys" :key="a" class="flex flex-wrap items-center gap-2 sm:gap-3">
      <label class="flex-1 min-w-[110px] sm:w-48 text-sm text-gray-700 font-medium truncate">{{ abilityLabels[a] }}</label>
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <button type="button" class="px-2 py-1 border rounded hover:bg-gray-50 active:scale-95" @click="dec(a)">−</button>
        <input
          type="number" min="0" max="10" step="1"
          v-model.number="abilityScores[a]" @change="normalize(a)"
          class="w-14 sm:w-16 border rounded px-2 py-1 text-center"
        />
        <button type="button" class="px-2 py-1 border rounded hover:bg-gray-50 active:scale-95" @click="inc(a)">+</button>
      </div>
    </div>
  </div>

  <!-- Columna derecha -->
  <div class="space-y-3">
    <div v-for="a in rightKeys" :key="a" class="flex flex-wrap items-center gap-2 sm:gap-3">
      <label class="flex-1 min-w-[110px] sm:w-48 text-sm text-gray-700 font-medium truncate">{{ abilityLabels[a] }}</label>
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <button type="button" class="px-2 py-1 border rounded hover:bg-gray-50 active:scale-95" @click="dec(a)">−</button>
        <input
          type="number" min="0" max="10" step="1"
          v-model.number="abilityScores[a]" @change="normalize(a)"
          class="w-14 sm:w-16 border rounded px-2 py-1 text-center"
        />
        <button type="button" class="px-2 py-1 border rounded hover:bg-gray-50 active:scale-95" @click="inc(a)">+</button>
      </div>
    </div>
  </div>
  <span class="text-xs text-gray-500">{{ t('players.zeroHint') }}</span>
</div>

    <!-- listado (muestra badges con los scores) -->
    <TransitionGroup name="player" tag="ul" class="grid md:grid-cols-2 gap-4" appear>
  <li v-for="p in players.items" :key="p._id" class="relative bg-white p-4 rounded-xl shadow border space-y-2 overflow-hidden cursor-pointer hover:shadow-md transition"
      @click="(e:any)=>{ if(e.target.closest('button')) return; router.push({ name: 'player-detail', params: { id: p._id } }) }">
        <button
          type="button"
            @click="removePlayer(p._id)"
            class="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center rounded-md bg-black text-white text-xs hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 transition-colors"
            title="Eliminar jugador"
        >
          <!-- ícono simple X -->
          <span class="-mt-px">✕</span>
        </button>
        <div class="font-medium pr-8 flex items-center gap-2">
          <span>{{ p.name }}</span>
          <span v-if="(p.gamesPlayed ?? 0) === 0" class="text-[10px] uppercase tracking-wide bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">{{ t('players.new') }}</span>
          <template v-if="p.userId && p.userId === currentUserId">
            <span class="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{{ t('players.myProfile') }}</span>
            <button
              type="button"
              @click="unclaim(p)"
              class="text-[10px] uppercase tracking-wide bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-500"
            >{{ t('players.unclaim') }}</button>
          </template>
          <span v-else-if="p.userId" class="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ t('players.claimed') }}</span>
          <button
            v-else-if="!myClaimedPlayerId"
            @click="claim(p)"
            class="text-[10px] uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-500"
          >{{ t('players.claim') }}</button>
        </div>
        <div class="text-sm text-gray-500" v-if="p.nickname">@{{ p.nickname }}</div>
        <div v-if="p.gamesPlayed !== undefined" class="text-xs text-gray-500">
          {{ t('players.gamesPlayed') }} <span class="font-medium">{{ p.gamesPlayed }}</span>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="([k, v]) in Object.entries(p.abilities || {})"
            :key="k"
            class="text-xs px-2 py-0.5 rounded-full bg-gray-100 border"
          >
            {{ abilityLabels[k as AbilityKey] ?? k }}: {{ v }}
          </span>
        </div>
      </li>
    </TransitionGroup>
  </div>
</div>
</template>

<style scoped>
.player-enter-from { opacity: 0; transform: translateY(6px) scale(.96); }
.player-enter-active { transition: all 200ms cubic-bezier(.4,0,.2,1); }
.player-leave-active { transition: all 160ms cubic-bezier(.4,0,.2,1); position: relative; }
.player-leave-to { opacity: 0; transform: translateX(-20px) scale(.92); }
.player-move { transition: transform 240ms cubic-bezier(.4,0,.2,1); }
</style>
