import { defineStore } from 'pinia'
import { api } from '../api'
import type { Match, Teams, UUID } from '../types'


export const useMatches = defineStore('matches', {
state: () => ({ items: [] as Match[], loading: false, current: null as Match | null }),
actions: {
async fetch() {
this.loading = true
try { this.items = await api.listMatches() } finally { this.loading = false }
},
async create(groupId: UUID, playerIds: UUID[], date: string) {
const m = await api.createMatch({ groupId, playerIds, date })
this.items.unshift(m)
return m
},
async open(id: UUID) { this.current = await api.getMatch(id) },
async generateTeams(id: UUID) { return await api.generateTeams(id) as Teams },
async finish(id: UUID, result: { teamA: number; teamB: number }) { await api.finishMatch(id, result); await this.open(id) },
}
})