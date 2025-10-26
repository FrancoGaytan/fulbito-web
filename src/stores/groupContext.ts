import { defineStore } from 'pinia';
import { localStorageKeys } from '../utils/localStorageKeys';

/**
 * Store de contexto de grupo activo (multi-membership Fase 1).
 * Centraliza el id del grupo seleccionado para contextualizar ratings / stats.
 */
export const useGroupContext = defineStore('groupContext', {
  state: () => ({
    activeGroupId: (typeof window !== 'undefined' ? localStorage.getItem(localStorageKeys.activeGroup) : '') || ''
  }),
  actions: {
    /** Establece el grupo activo persistiendo en localStorage. */
    setActive(groupId: string) {
      this.activeGroupId = groupId;
      if (groupId) localStorage.setItem(localStorageKeys.activeGroup, groupId);
      else localStorage.removeItem(localStorageKeys.activeGroup);
    },
    /** Limpia selección */
    clear() { this.setActive(''); }
  }
});
