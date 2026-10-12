import { http, unwrap } from './http';
import type { AuthResult, UserProfile } from './types';

export const sendCode = (phone: string) => unwrap<void>(http.post('/auth/sms-code', { phone }));

export const register = (phone: string, code: string, password: string, nickname?: string) =>
  unwrap<AuthResult>(http.post('/auth/register', { phone, code, password, nickname }));

export const login = (phone: string, password: string) =>
  unwrap<AuthResult>(http.post('/auth/login', { phone, password }));

export const me = () => unwrap<UserProfile>(http.get('/users/me'));
