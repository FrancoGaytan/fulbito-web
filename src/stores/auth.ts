import { defineStore } from 'pinia'
import { login as apiLogin } from '../lib/auth.service'
import { localStorageKeys } from '../utils/localStorageKeys'
import { useSpaces } from './spaces'
import type { LoginRequest } from '../types'

function clearSpacesState() {
  localStorage.removeItem(localStorageKeys.activeSpaceId)
  // Limpiar el store en memoria para que no queden datos del usuario anterior
  const spacesStore = useSpaces()
  spacesStore.$patch({ spaces: [], activeSpaceId: null, loading: false, error: null })
}

export const useAuth = defineStore('auth', {
  state: () => ({
    token: (localStorage.getItem(localStorageKeys.token) || '') as string,
    loading: false,
    error: '' as string | null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    async login(payload: LoginRequest) {
      this.loading = true
      this.error = null
      // Limpiar estado del usuario anterior antes de loguear uno nuevo
      clearSpacesState()
      try {
        const token = await apiLogin(payload)
        this.token = token
        localStorage.setItem(localStorageKeys.token, token)
      } catch (e: any) {
        this.error = e?.message || 'Error de login'
        throw e
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.token = ''
      localStorage.removeItem(localStorageKeys.token)
      clearSpacesState()
    },
  },
})
