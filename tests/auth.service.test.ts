import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as http from '@/lib/httpService'
import * as auth from '@/lib/auth.service'
import { localStorageKeys } from '@/utils/localStorageKeys'

vi.mock('@/lib/httpService')

const mhttp: any = http

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

describe('auth.service login fallback', () => {
  it('tries first endpoint then falls back on 404', async () => {
    const token = 'abc.123.token'
    // First call -> 404 error simulation
    mhttp._postNoAuth.mockRejectedValueOnce({ status: 404, message: 'Not found' })
    // Second call -> success
    mhttp._postNoAuth.mockResolvedValueOnce({ token })

    const result = await auth.login({ email: 'a@b.com', password: 'x' })
    expect(result).toBe(token)
    expect(localStorage.getItem(localStorageKeys.token)).toBe(token)
    expect(mhttp._postNoAuth).toHaveBeenCalledTimes(2)
  })

  it('stops early on non-404 error', async () => {
    mhttp._postNoAuth.mockRejectedValueOnce({ status: 500, message: 'Boom' })
    await expect(auth.login({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({ status: 500 })
    expect(mhttp._postNoAuth).toHaveBeenCalledTimes(1)
  })
})

describe('auth.service register fallback', () => {
  it('returns endpoint info on success', async () => {
    mhttp._postNoAuth.mockResolvedValueOnce({ token: 't1' })
    const res = await auth.register({ email: 'c@d.com', password: 'y' })
    expect(res.endpoint).toBe('/api/auth/register')
    expect(res.token).toBe('t1')
  })

  it('falls back on 404 then succeeds', async () => {
    mhttp._postNoAuth.mockRejectedValueOnce({ status: 404 })
    mhttp._postNoAuth.mockResolvedValueOnce({ token: 't2' })
    const res = await auth.register({ email: 'e@f.com', password: 'z' })
    expect(res.token).toBe('t2')
    expect(mhttp._postNoAuth).toHaveBeenCalledTimes(2)
  })
})
