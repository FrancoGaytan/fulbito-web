import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayers } from '@/stores/players'
import * as playersService from '@/lib/players.service'

vi.mock('@/lib/players.service')

const mockPlayers = [
  { _id: 'p1', name: 'Juan', rating: 1200 },
  { _id: 'p2', name: 'Luis', rating: 1210 }
] as any

// @ts-expect-error partial mock
playersService.listAllPlayers.mockResolvedValue(mockPlayers)

describe('players store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetch() loads players into items', async () => {
    const store = usePlayers()
    expect(store.items.length).toBe(0)
    await store.fetch()
    expect(store.items).toEqual(mockPlayers)
    expect(store.loading).toBe(false)
  })

  it('nameById returns name or id fallback', () => {
    const store = usePlayers()
    store.items = mockPlayers
    expect(store.nameById('p1')).toBe('Juan')
    expect(store.nameById('zzz')).toBe('zzz')
  })
})
