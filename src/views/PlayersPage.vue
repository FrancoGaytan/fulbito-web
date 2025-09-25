<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { abilityKeys, abilityLabels, type AbilityKey } from '../constants/abilities'
import * as playersApi from '../lib/players.service'
import { usePlayers } from '../stores/players'
import { useGroups } from '../stores/groups'

const players = usePlayers()
const groups = useGroups()

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
  // mandamos solo las que sean > 0
  const payload: Partial<Record<AbilityKey, number>> = {}
  for (const k of abilityKeys) {
    const v = clamp(abilityScores[k])
    if (v > 0) payload[k] = v
  }
  const p = await playersApi.createPlayer(name.value, nickname.value || undefined, payload)
  players.items.push(p)

  // reset
  name.value = ''
  nickname.value = ''
  abilityKeys.forEach(k => (abilityScores[k] = 0))
}

onMounted(() => { players.fetch(); groups.fetch() })
</script>

<template>
<div class="space-y-6">
  <h1 class="text-2xl font-semibold">Jugadores</h1>

  <div class="bg-white p-4 rounded-xl shadow border space-y-4">
    <h2 class="font-medium">Crear jugador</h2>

    <div class="grid md:grid-cols-3 gap-3">
      <input v-model="name" placeholder="Nombre" class="border rounded px-3 py-2" />
      <input v-model="nickname" placeholder="Apodo (opcional)" class="border rounded px-3 py-2" />
      <button @click="createPlayer" class="px-4 py-2 rounded bg-black text-white">Crear</button>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
  <!-- Columna izquierda -->
  <div class="space-y-3">
    <div v-for="a in leftKeys" :key="a" class="flex items-center gap-3">
      <label class="w-48 text-sm text-gray-700 font-medium">{{ abilityLabels[a] }}</label>
      <div class="flex items-center gap-2">
        <button type="button" class="px-2 py-1 border rounded" @click="dec(a)">−</button>
        <input
          type="number" min="0" max="10" step="1"
          v-model.number="abilityScores[a]" @change="normalize(a)"
          class="w-16 border rounded px-2 py-1 text-center"
        />
        <button type="button" class="px-2 py-1 border rounded" @click="inc(a)">+</button>
      </div>
    </div>
  </div>

  <!-- Columna derecha -->
  <div class="space-y-3">
    <div v-for="a in rightKeys" :key="a" class="flex items-center gap-3">
      <label class="w-48 text-sm text-gray-700 font-medium">{{ abilityLabels[a] }}</label>
      <div class="flex items-center gap-2">
        <button type="button" class="px-2 py-1 border rounded" @click="dec(a)">−</button>
        <input
          type="number" min="0" max="10" step="1"
          v-model.number="abilityScores[a]" @change="normalize(a)"
          class="w-16 border rounded px-2 py-1 text-center"
        />
        <button type="button" class="px-2 py-1 border rounded" @click="inc(a)">+</button>
      </div>
    </div>
  </div>
  <span class="text-xs text-gray-500">0 = no informar</span>
</div>

    <!-- listado (muestra badges con los scores) -->
    <ul class="grid md:grid-cols-2 gap-4">
      <li v-for="p in players.items" :key="p._id" class="bg-white p-4 rounded-xl shadow border space-y-2">
        <div class="font-medium">{{ p.name }}</div>
        <div class="text-sm text-gray-500" v-if="p.nickname">@{{ p.nickname }}</div>
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
    </ul>
  </div>
</div>
</template>
