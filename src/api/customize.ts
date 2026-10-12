import { http, unwrap } from './http';
import type { CompleteResult, QaRule, SaveAnswersPayload, SessionResponse } from './types';

type RawQaRule = Omit<QaRule, 'options'> & { options: string | null };

export async function questions(): Promise<QaRule[]> {
  const raw = await unwrap<RawQaRule[]>(http.get('/customize/questions'));
  return raw.map((r) => ({
    ...r,
    options: parseOptions(r.options),
  }));
}

function parseOptions(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const createSession = (sourceNoteId?: number) =>
  unwrap<SessionResponse>(http.post('/customize/sessions', sourceNoteId ? { sourceNoteId } : {}));

export const getSession = (id: number | string, sessionToken?: string | null) =>
  unwrap<SessionResponse>(
    http.get(`/customize/sessions/${id}`, sessionHeaders(sessionToken)),
  );

export const saveAnswers = (id: number | string, payload: SaveAnswersPayload, sessionToken?: string | null) =>
  unwrap<SessionResponse>(
    http.patch(`/customize/sessions/${id}/answers`, payload, sessionHeaders(sessionToken)),
  );

export const completeSession = (id: number | string, sessionToken?: string | null) =>
  unwrap<CompleteResult>(http.post(`/customize/sessions/${id}/complete`, {}, sessionHeaders(sessionToken)));

export const bindSession = (id: number | string, sessionToken?: string | null) =>
  unwrap<SessionResponse>(
    http.post(`/customize/sessions/${id}/bind`, {}, sessionHeaders(sessionToken)),
  );

function sessionHeaders(sessionToken?: string | null) {
  return sessionToken ? { headers: { 'X-Session-Token': sessionToken } } : {};
}
