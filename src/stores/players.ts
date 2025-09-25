import { defineStore } from 'pinia'
import { api } from '../api'
import type { Player } from '../types'


export const usePlayers = defineStore('players', {
state: () => ({ items: [] as Player[], loading: false }),
actions: {
async fetch() {
this.loading = true
try { this.items = await api.listPlayers() } finally { this.loading = false }
},
}
})