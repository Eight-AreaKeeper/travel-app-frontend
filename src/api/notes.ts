import { http, unwrap } from './http';
import type { Comment, CreateNotePayload, NoteDetail, NoteSummary, PageResult } from './types';

export type ListNotesParams = {
  destinationId?: number;
  keyword?: string;
  daysMin?: number;
  daysMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  sort?: 'recommend' | 'latest' | 'budget_asc';
  page?: number;
  pageSize?: number;
};

export const listNotes = (params: ListNotesParams = {}) =>
  unwrap<PageResult<NoteSummary>>(
    http.get('/notes', { params: { page: 1, pageSize: 10, ...params } }),
  );

export const getNote = (id: number | string) => unwrap<NoteDetail>(http.get(`/notes/${id}`));

export const createNote = (payload: CreateNotePayload) =>
  unwrap<NoteDetail>(http.post('/notes', payload));

export const updateNote = (id: number | string, payload: CreateNotePayload) =>
  unwrap<NoteDetail>(http.put(`/notes/${id}`, payload));

export const deleteNote = (id: number | string) => unwrap<void>(http.delete(`/notes/${id}`));

export const listComments = (id: number | string, page = 1, pageSize = 20) =>
  unwrap<PageResult<Comment>>(http.get(`/notes/${id}/comments`, { params: { page, pageSize } }));

export const createComment = (id: number | string, content: string, parentId?: number) =>
  unwrap<Comment>(http.post(`/notes/${id}/comments`, { content, parentId }));

export const deleteComment = (id: number | string, commentId: number | string) =>
  unwrap<void>(http.delete(`/notes/${id}/comments/${commentId}`));

export const likeNote = (id: number | string) => unwrap<void>(http.post(`/notes/${id}/like`));
export const unlikeNote = (id: number | string) => unwrap<void>(http.delete(`/notes/${id}/like`));
export const favoriteNote = (id: number | string) => unwrap<void>(http.post(`/notes/${id}/favorite`));
export const unfavoriteNote = (id: number | string) => unwrap<void>(http.delete(`/notes/${id}/favorite`));
