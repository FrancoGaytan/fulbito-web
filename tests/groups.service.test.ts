import { describe, it, expect, vi } from 'vitest'
import * as http from '@/lib/httpService'
import * as groups from '@/lib/groups.service'

vi.mock('@/lib/httpService')
const mhttp: any = http

describe('groups.service basic endpoints', () => {
  it('createGroup posts name/description when description present', async () => {
    mhttp._post.mockImplementation(async (_path: string, body: any) => ({ _id: 'g1', ...body }))
    const g = await groups.createGroup('Grupo A', 'Desc')
    expect(g._id).toBe('g1')
    expect(mhttp._post).toHaveBeenCalledWith('/groups', { name: 'Grupo A', description: 'Desc' })
  })

  it('createGroup omits description if blank', async () => {
    mhttp._post.mockImplementationOnce(async (_path: string, body: any) => ({ _id: 'g2', ...body }))
    const g = await groups.createGroup('SoloNombre', '   ')
    expect(g._id).toBe('g2')
    expect(mhttp._post).toHaveBeenCalledWith('/groups', { name: 'SoloNombre' })
  })

  it('addPlayersToGroup posts array', async () => {
    mhttp._post.mockResolvedValueOnce({ _id: 'g1', players: ['p1','p2'] })
    const res = await groups.addPlayersToGroup('g1','p1 p2'.split(' '))
    expect(res.players).toContain('p1')
  })
})
