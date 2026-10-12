const STORAGE_KEY = 'customize_pending_session';

interface PendingSession {
  id: number;
  token: string;
}

export function savePendingSession(id: number, token: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, token }));
}

export function getPendingSession(): PendingSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSession;
  } catch {
    return null;
  }
}

export function clearPendingSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
