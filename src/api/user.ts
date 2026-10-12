import { http, unwrap } from './http';
import type { NoteSummary, PageResult, UpdateProfilePayload, UserProfile } from './types';

export const updateProfile = (payload: UpdateProfilePayload) =>
  unwrap<UserProfile>(http.patch('/users/me', payload));

export const listFavorites = (page = 1, pageSize = 10) =>
  unwrap<PageResult<NoteSummary>>(http.get('/users/me/favorites', { params: { page, pageSize } }));
