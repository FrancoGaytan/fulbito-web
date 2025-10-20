import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as http from '@/lib/httpService'
import * as players from '@/lib/players.service'

vi.mock('@/lib/httpService')
const mhttp: any = http

// Aislar mocks entre tests para que los conteos de llamadas no se acumulen
beforeEach(() => {
  vi.resetAllMocks()
})

describe('players.service listAllPlayers', () => {
  it('calls /api/players/all', async () => {
    mhttp._get.mockResolvedValueOnce([{ _id: 'p1', name: 'A' }])
    const res = await players.listAllPlayers()
  expect(res && res[0] && res[0].name).toBe('A')
    expect(mhttp._get).toHaveBeenCalledWith('/api/players/all', undefined)
  })
})

describe('players.service getPlayer fallback', () => {
  it('falls back to legacy route on 404', async () => {
    mhttp._get
      .mockRejectedValueOnce({ status: 404, message: 'not found' })
      .mockResolvedValueOnce({ _id: 'p9', name: 'Legacy' })
    const p = await players.getPlayer('p9')
    expect(p._id).toBe('p9')
    expect(mhttp._get).toHaveBeenCalledTimes(2)
  })
})

describe('players.service updatePlayerSkills firstOk', () => {
  it('tries new then legacy patch', async () => {
    mhttp._patch
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ _id: 'p2', name: 'B', abilities: { running: 5 } })
    const updated = await players.updatePlayerSkills('p2', { running: 5 })
    expect((updated as any).abilities?.running).toBe(5)
    expect(mhttp._patch).toHaveBeenCalledTimes(2)
  })
})
