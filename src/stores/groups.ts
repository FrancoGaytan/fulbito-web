import { defineStore } from 'pinia'
import { api } from '../api'
import type { Group } from '../types'


export const useGroups = defineStore('groups', {
state: () => ({ items: [] as Group[], loading: false, error: '' as string | null }),
actions: {
async fetch() {
this.loading = true
try { this.items = await api.listGroups() } finally { this.loading = false }
},
async create(name: string, description?: string) {
const g = await api.createGroup({ name, description })
this.items.push(g)
return g
},
}
})