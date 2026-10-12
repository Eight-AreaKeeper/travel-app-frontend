import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { me } from '../api/auth';
import { uploadFile } from '../api/files';
import { updateProfile } from '../api/user';
import type { ApiError, UserProfile } from '../api/types';
import { useAuthStore, isLoggedIn } from '../store/auth';
import { toast } from '../components/Toast';
import { Loading, EmptyState } from '../components/Feedback';
import { useNavigate } from 'react-router-dom';

const GENDER_LABELS: Record<number, string> = { 0: 'Unspecified', 1: 'Male', 2: 'Female' };

export function Profile() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState(0);
  const [birthday, setBirthday] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    me().then((p) => {
      setProfile(p);
      setNickname(p.nickname ?? '');
      setGender(p.gender ?? 0);
      setBirthday(p.birthday ?? '');
    });
  }, []);

  if (!isLoggedIn()) {
    return (
      <div className="form-page">
        <EmptyState title="Log in to view your profile" />
        <button className="btn" onClick={() => navigate('/login')}>
          Log in
        </button>
      </div>
    );
  }

  if (!profile) return <Loading label="Loading profile…" />;

  const pickAvatar = () => fileInputRef.current?.click();

  const onAvatarSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    uploadFile(file, 'avatar')
      .then(({ url }) => updateProfile({ avatarUrl: url }))
      .then((updated) => {
        setProfile(updated);
        setUser(updated);
        toast('Avatar updated');
      })
      .catch((err: ApiError) => toast(err.message ?? 'Failed to upload avatar'))
      .finally(() => setUploading(false));
  };

  const save = () => {
    setSaving(true);
    updateProfile({ nickname: nickname.trim() || undefined, gender, birthday: birthday || undefined })
      .then((updated) => {
        setProfile(updated);
        setUser(updated);
        toast('Profile saved');
      })
      .catch((err: ApiError) => toast(err.message ?? 'Failed to save'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="form-page">
      <h1>Profile</h1>

      <div className="field" style={{ alignItems: 'center' }}>
        <label>Avatar</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Avatar"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--mist, #eee)',
              }}
            />
          )}
          <button className="btn ghost small" disabled={uploading} onClick={pickAvatar}>
            {uploading ? 'Uploading…' : 'Change avatar'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={onAvatarSelected}
          />
        </div>
      </div>

      <div className="field">
        <label>Phone number</label>
        <input value={profile.phone} disabled />
      </div>

      <div className="field">
        <label>Nickname</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" />
      </div>

      <div className="field">
        <label>Gender</label>
        <div className="chip-row">
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${gender === Number(value) ? 'active' : ''}`}
              onClick={() => setGender(Number(value))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Birthday</label>
        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      </div>

      <button className="btn" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
