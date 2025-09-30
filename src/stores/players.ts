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
	// Intentar cargar lista global (owner o no) para tener nombres de participantes
	try {
		this.items = await listAllPlayers()
	} catch {
		// fallback al endpoint antiguo si el global no existe
		this.items = await api.listPlayers()
	}
} finally { this.loading = false }
},
}
})