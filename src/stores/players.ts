import { defineStore } from 'pinia'
import { api } from '../api'
import type { Player } from '../types'
import { listAllPlayers } from '../lib/players.service'


export const usePlayers = defineStore('players', {
state: () => ({ items: [] as Player[], loading: false }),
getters: {
	nameById: (s) => (id: string) => s.items.find(p => p._id === id)?.name || id,
},
actions: {
async fetch() {
this.loading = true
try {
	try { this.items = await listAllPlayers() }
	catch { this.items = await api.listPlayers() }
} finally { this.loading = false }
},
}
})