import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, me, register, sendCode } from '../api/auth';
import { bindSession } from '../api/customize';
import type { ApiError } from '../api/types';
import { useAuthStore } from '../store/auth';
import { toast } from '../components/Toast';
import { clearPendingSession, getPendingSession } from '../lib/pendingSession';

export function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const requestCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) return toast('Please enter a valid phone number');
    sendCode(phone)
      .then(() => {
        toast('Verification code sent, check the backend logs');
        setCooldown(60);
        timerRef.current = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      })
      .catch((e: ApiError) => toast(e.message ?? 'Failed to send'));
  };

  const submit = () => {
    setSubmitting(true);
    const task = isRegister ? register(phone, code, password) : login(phone, password);
    task
      .then(async (result) => {
        if (isRegister) {
          toast('Registration successful, please log in');
          setIsRegister(false);
          setPassword('');
          return;
        }
        setTokens(result.accessToken, result.refreshToken);
        try {
          setUser(await me());
        } catch {
          /* profile fetch is best-effort */
        }
        const pending = getPendingSession();
        if (pending) {
          try {
            await bindSession(pending.id, pending.token);
          } catch {
            /* binding is best-effort — the session just stays anonymous */
          } finally {
            clearPendingSession();
          }
        }
        navigate('/');
      })
      .catch((e: ApiError) => toast(e.message ?? 'Action failed, please check your input or the backend service'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="form-page">
      <h1>{isRegister ? 'Sign up for TravelTicket' : 'Log in to TravelTicket'}</h1>
      <div className="field">
        <label>Phone number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
      </div>
      {isRegister && (
        <div className="field">
          <label>Verification code</label>
          <div className="form-row-inline">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
            <button className="btn ghost" disabled={cooldown > 0} onClick={requestCode}>
              {cooldown > 0 ? `${cooldown}s` : 'Send code'}
            </button>
          </div>
        </div>
      )}
      <div className="field">
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="6-20 character password"
        />
      </div>
      <button className="btn" disabled={submitting} onClick={submit}>
        {isRegister ? 'Sign up' : 'Log in'}
      </button>
      <p className="form-switch">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}
        <button onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Log in' : 'Sign up'}</button>
      </p>
    </div>
  );
}
