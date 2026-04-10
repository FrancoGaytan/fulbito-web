<script setup lang="ts">
import type { UUID } from '../types'
import { api } from '../api'


const props = defineProps<{ matchId: UUID; playerId: UUID }>()


async function send(value: 'up' | 'neutral' | 'down') {
await api.sendFeedback(props.matchId, { matchId: props.matchId, playerId: props.playerId, value })
}
</script>
<template>
<div class="inline-flex rounded-xl overflow-hidden border border-dark-500/40">
<button class="px-3 py-1 hover:bg-accent/10 text-accent transition" @click="send('up')">👍</button>
<button class="px-3 py-1 hover:bg-dark-600 text-gray-400 transition" @click="send('neutral')">👉</button>
<button class="px-3 py-1 hover:bg-red-500/10 text-red-400 transition" @click="send('down')">👎</button>
</div>
</template>