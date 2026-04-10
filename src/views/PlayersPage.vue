<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { t } from '@/localizations'
import CenteredLoader from '../components/CenteredLoader.vue'
import PlayerCard from '../components/PlayerCard.vue'
import { localStorageKeys } from '../utils/localStorageKeys'
import { useRouter } from 'vue-router'
import { abilityKeys, abilityLabels, type AbilityKey } from '../constants/abilities'
import * as playersApi from '../lib/players.service'
import { usePlayers } from '../stores/players'
import { useGroups } from '../stores/groups'

// Stores
const players = usePlayers()
const router = useRouter()
const groups = useGroups()
const loading = ref(true)

const name = ref('')
const nickname = ref('')

const abilityScores = reactive<Record<AbilityKey, number>>(
  Object.fromEntries(abilityKeys.map(k => [k, 0])) as Record<AbilityKey, number>
)

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n || 0)))
function inc(key: AbilityKey) { abilityScores[key] = clamp((abilityScores[key] ?? 0) + 1) }
function dec(key: AbilityKey) { abilityScores[key] = clamp((abilityScores[key] ?? 0) - 1) }
function normalize(key: AbilityKey) { abilityScores[key] = clamp(abilityScores[key]) }

/**
 * Create a new player with provided name/nickname & non-zero ability scores.
 * Resets form fields on success.
 * @returns {Promise<void>}
 */
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
/** Load initial players & groups data, populating list */
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


/**
 * Claim a player for current user (if unclaimed).
 * @param {any} p Player object from list.
 * @returns {Promise<void>}
 */
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

/**
 * Unclaim a player (detach ownership) reverting to no user owner.
 * @param {any} p Player object from list.
 * @returns {Promise<void>}
 */
async function unclaim(p: any) {
  try {
    const updated = await playersApi.unclaimPlayer(p._id)
    const idx = players.items.findIndex(x => x._id === p._id)
    if (idx >= 0) players.items[idx] = updated
  } catch (e: any) {
  alert(e?.message || t('players.unclaimError'))
  }
}

/**
 * Delete player by id and remove from local store list.
 * @param {string} id Player identifier.
 * @returns {Promise<void>}
 */
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
  <h1 class="text-2xl font-bold text-white">{{ t('players.title') }}</h1>

  <!-- Create Player Card -->
  <div class="card p-5 space-y-5">
    <div class="flex items-center gap-2">
      <span class="text-accent text-lg">👤</span>
      <h2 class="font-bold text-white uppercase tracking-wide text-sm">{{ t('players.createTitle') }}</h2>
    </div>

    <div class="space-y-3">
      <div class="space-y-1.5">
        <label class="section-label">NOMBRE COMPLETO</label>
        <input v-model="name" :placeholder="'Ej: Julian Alvarez'" class="input-dark" />
      </div>
      <div class="space-y-1.5">
        <label class="section-label">APODO</label>
        <input v-model="nickname" :placeholder="'Ej: La Araña'" class="input-dark" />
      </div>
    </div>

    <!-- Ability sliders -->
    <div class="space-y-1">
      <h3 class="section-label mb-3">ATRIBUTOS TÉCNICOS</h3>
      <div class="space-y-4">
        <div v-for="a in abilityKeys" :key="a" class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-sm text-gray-300 font-medium">{{ abilityLabels[a] }}</label>
            <span class="text-sm font-bold text-accent tabular-nums">{{ abilityScores[a] }}</span>
          </div>
          <input
            type="range" min="0" max="10" step="1"
            v-model.number="abilityScores[a]"
            class="w-full accent-accent h-1.5 bg-dark-500 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,197,94,0.5)]"
          />
        </div>
      </div>
    </div>

    <button @click="createPlayer" class="btn-accent" :disabled="!name.trim()">CONFIRMAR FICHAJE</button>
  </div>

  <!-- Player list -->
  <TransitionGroup name="player" tag="ul" class="grid md:grid-cols-2 gap-4" appear>
    <PlayerCard
      v-for="p in players.items"
      :key="p._id"
      :player="p"
      :current-user-id="currentUserId"
      :my-claimed-player-id="myClaimedPlayerId"
      @open="(pl)=> router.push({ name: 'player-detail', params: { id: pl._id } })"
      @remove="removePlayer"
      @claim="claim"
      @unclaim="unclaim"
    />
  </TransitionGroup>
</div>
</template>

<style scoped>
.player-enter-from { opacity: 0; transform: translateY(6px) scale(.96); }
.player-enter-active { transition: all 200ms cubic-bezier(.4,0,.2,1); }
.player-leave-active { transition: all 160ms cubic-bezier(.4,0,.2,1); position: relative; }
.player-leave-to { opacity: 0; transform: translateX(-20px) scale(.92); }
.player-move { transition: transform 240ms cubic-bezier(.4,0,.2,1); }
</style>
