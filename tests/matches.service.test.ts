import { describe, it, expect, vi } from 'vitest'
import * as http from '@/lib/httpService'
import * as matches from '@/lib/matches.service'

vi.mock('@/lib/httpService')

const _get = http as any
const _post = http as any

// Mock listByGroup
_get._get.mockImplementation(async (path: string) => {
  if (path.startsWith('/matches/group/')) {
    return {
      matches: [
        { _id: 'm1', groupId: 'g1', participants: ['p1','p2'] }
      ],
      meta: { canCreate: true, isOwner: true }
    }
  }
  throw new Error('Unexpected path ' + path)
})

_post._post.mockImplementation(async (path: string, body: any) => {
  if (path === '/matches') {
    return { _id: 'created1', groupId: body.groupId, participants: body.participants }
  }
  throw new Error('Unexpected POST ' + path)
})

describe('matches.service', () => {
  it('listByGroup returns matches + meta', async () => {
    const resp = await matches.listByGroup('g1' as any)
    expect(resp.matches).toHaveLength(1)
    expect(resp.meta.canCreate).toBe(true)
  })

  it('create posts correct payload', async () => {
    const m = await matches.create('g1' as any, ['p1','p2'], '2024-01-01T10:00:00Z')
    expect(m._id).toBe('created1')
    expect(m.participants).toEqual(['p1','p2'])
  })
})
