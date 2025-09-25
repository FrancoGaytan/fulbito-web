<script setup lang="ts">
import type { UUID } from '../types'
import { api } from '../api'


const props = defineProps<{ matchId: UUID; playerId: UUID }>()


async function send(value: 'up' | 'neutral' | 'down') {
await api.sendFeedback(props.matchId, { matchId: props.matchId, playerId: props.playerId, value })
}
</script>
<template>
<div class="inline-flex rounded overflow-hidden border">
<button class="px-3 py-1 hover:bg-gray-100" @click="send('up')">👍</button>
<button class="px-3 py-1 hover:bg-gray-100" @click="send('neutral')">👉</button>
<button class="px-3 py-1 hover:bg-gray-100" @click="send('down')">👎</button>
</div>
</template>