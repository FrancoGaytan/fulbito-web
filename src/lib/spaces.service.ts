import { _get, _post, _postNoAuth as _postNA, _patch, _put } from './httpService';
import type { Space, SpacePlayer, SpaceMember } from '../types';

export const spacesService = {
  list(): Promise<Space[]> {
    return _get<Space[]>('/spaces');
  },

  get(id: string): Promise<Space> {
    return _get<Space>(`/spaces/${id}`);
  },

  create(payload: { name: string; description?: string }): Promise<Space> {
    return _post<Space>('/spaces', payload);
  },

  update(id: string, payload: { name?: string; description?: string }): Promise<Space> {
    return _patch<Space>(`/spaces/${id}`, payload);
  },

  join(inviteCode: string): Promise<{ message: string; space: Space }> {
    return _post<{ message: string; space: Space }>('/spaces/join', { inviteCode });
  },

  listMembers(id: string): Promise<SpaceMember[]> {
    return _get<SpaceMember[]>(`/spaces/${id}/members`);
  },

  regenerateCode(id: string): Promise<{ inviteCode: string }> {
    return _post<{ inviteCode: string }>(`/spaces/${id}/regenerate-code`, {});
  },

  getMyProfile(spaceId: string): Promise<SpacePlayer | null> {
    return _get<SpacePlayer | null>(`/spaces/${spaceId}/me`);
  },

  upsertMyProfile(spaceId: string, payload: { name: string; nickname?: string; abilities?: Record<string, number> }): Promise<SpacePlayer> {
    return _put<SpacePlayer>(`/spaces/${spaceId}/me`, payload);
  },

  listPlayers(spaceId: string): Promise<SpacePlayer[]> {
    return _get<SpacePlayer[]>(`/spaces/${spaceId}/players`);
  },
};
