import { defineStore } from 'pinia';
import { spacesService } from '../lib/spaces.service';
import { localStorageKeys } from '../utils/localStorageKeys';
import type { Space } from '../types';

export const useSpaces = defineStore('spaces', {
  state: () => ({
    spaces: [] as Space[],
    activeSpaceId: localStorage.getItem(localStorageKeys.activeSpaceId) ?? null as string | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeSpace: (s): Space | null =>
      s.spaces.find(sp => sp._id === s.activeSpaceId) ?? null,

    hasActiveSpace: (s): boolean => !!s.activeSpaceId,
  },

  actions: {
    async fetchSpaces() {
      this.loading = true;
      this.error = null;
      try {
        this.spaces = await spacesService.list();
        // Si no hay active space pero sí hay spaces, seleccionar el primero automáticamente
        if (!this.activeSpaceId && this.spaces.length > 0) {
          this.setActiveSpace(this.spaces[0]._id);
        }
        // Si el active space ya no existe (fue eliminado o expulsado), resetear
        if (this.activeSpaceId && !this.spaces.find(sp => sp._id === this.activeSpaceId)) {
          this.setActiveSpace(this.spaces[0]?._id ?? null);
        }
      } catch (e: any) {
        this.error = e?.message ?? 'Error cargando spaces';
      } finally {
        this.loading = false;
      }
    },

    setActiveSpace(id: string | null) {
      this.activeSpaceId = id;
      if (id) {
        localStorage.setItem(localStorageKeys.activeSpaceId, id);
      } else {
        localStorage.removeItem(localStorageKeys.activeSpaceId);
      }
    },

    async createSpace(name: string, description?: string): Promise<Space> {
      const space = await spacesService.create({ name, description });
      this.spaces.push(space);
      this.setActiveSpace(space._id);
      return space;
    },

    async joinSpace(inviteCode: string): Promise<Space> {
      const { space } = await spacesService.join(inviteCode);
      // Recargar la lista para obtener el role correcto
      await this.fetchSpaces();
      this.setActiveSpace(space._id);
      return space;
    },
  },
});
