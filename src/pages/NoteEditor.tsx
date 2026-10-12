import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNote } from '../api/notes';
import { uploadFile } from '../api/files';
import type { ApiError, DayPlanItem, Destination } from '../api/types';
import { DestinationPicker } from '../components/DestinationPicker';
import { toast } from '../components/Toast';
import { isLoggedIn } from '../store/auth';
import { EmptyState } from '../components/Feedback';

let dayPlanKeySeq = 0;
type DayPlanDraft = DayPlanItem & { key: number };
const newDayPlanRow = (dayNumber: number): DayPlanDraft => ({ key: ++dayPlanKeySeq, dayNumber, title: '', description: '', cost: undefined });

export function NoteEditor() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState<Destination[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [days, setDays] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState('');
  const [transportType, setTransportType] = useState('');
  const [bestSeason, setBestSeason] = useState('');
  const [dayPlans, setDayPlans] = useState<DayPlanDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn()) {
    return (
      <div className="form-page">
        <EmptyState title="Log in to publish a travel note" />
        <button className="btn" onClick={() => navigate('/login')}>
          Log in
        </button>
      </div>
    );
  }

  const onCoverSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    uploadFile(file, 'note_cover')
      .then(({ url }) => setCoverImage(url))
      .catch((err: ApiError) => toast(err.message ?? 'Failed to upload cover image'))
      .finally(() => setUploadingCover(false));
  };

  const addDayPlan = () => setDayPlans((prev) => [...prev, newDayPlanRow(prev.length + 1)]);
  const removeDayPlan = (key: number) =>
    setDayPlans((prev) => prev.filter((p) => p.key !== key).map((p, i) => ({ ...p, dayNumber: i + 1 })));
  const updateDayPlan = (key: number, patch: Partial<DayPlanDraft>) =>
    setDayPlans((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const submit = () => {
    if (!destination[0]) return toast('Please select a destination first');
    if (!title.trim() || !content.trim()) return toast('Title and content cannot be empty');
    setSubmitting(true);
    createNote({
      destinationId: destination[0].id,
      title: title.trim(),
      content: content.trim(),
      coverImage: coverImage.trim() || undefined,
      days: days.trim() ? Number(days) : undefined,
      budgetPerPerson: budgetPerPerson.trim() ? Number(budgetPerPerson) : undefined,
      transportType: transportType.trim() || undefined,
      bestSeason: bestSeason.trim() || undefined,
      tags: tagsInput
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      dayPlans: dayPlans.length
        ? dayPlans.map(({ dayNumber, title: t, description, cost }) => ({ dayNumber, title: t, description, cost }))
        : undefined,
    })
      .then((note) => {
        toast('Published successfully');
        navigate(`/guides/${note.id}`);
      })
      .catch((e: ApiError) => toast(e.message ?? 'Failed to publish'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="form-page wide">
      <h1>Publish a Travel Note</h1>
      <div className="field">
        <label>Destination</label>
        <DestinationPicker selected={destination} onChange={setDestination} multiple={false} />
      </div>
      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your travel note a title" />
      </div>
      <div className="field">
        <label>Cover image (optional)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {coverImage && (
            <img src={coverImage} alt="Cover preview" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8 }} />
          )}
          <button
            type="button"
            className="btn ghost small"
            disabled={uploadingCover}
            onClick={() => coverInputRef.current?.click()}
          >
            {uploadingCover ? 'Uploading…' : coverImage ? 'Change cover' : 'Upload cover'}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={onCoverSelected}
          />
        </div>
      </div>
      <div className="field">
        <label>Tags (comma separated, optional)</label>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Immersive experience, Nature" />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label>Trip length (optional)</label>
          <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="5" type="number" min={1} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label>Cost per person (optional)</label>
          <input value={budgetPerPerson} onChange={(e) => setBudgetPerPerson(e.target.value)} placeholder="2800" type="number" min={0} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label>Transport (optional)</label>
          <input value={transportType} onChange={(e) => setTransportType(e.target.value)} placeholder="High-speed rail" />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label>Best season (optional)</label>
          <input value={bestSeason} onChange={(e) => setBestSeason(e.target.value)} placeholder="Spring" />
        </div>
      </div>
      <div className="field">
        <label>Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your travel story" />
      </div>
      <div className="field">
        <label>Structured daily route (optional, used for the "Trip at a Glance" detail page)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayPlans.map((plan) => (
            <div key={plan.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ minWidth: 48, color: 'var(--slate)' }}>Day {plan.dayNumber}</span>
              <input
                value={plan.title ?? ''}
                onChange={(e) => updateDayPlan(plan.key, { title: e.target.value })}
                placeholder="Title, e.g.: Arrive in Dali, check into inn"
                style={{ flex: 2 }}
              />
              <input
                value={plan.description ?? ''}
                onChange={(e) => updateDayPlan(plan.key, { description: e.target.value })}
                placeholder="Additional notes (optional)"
                style={{ flex: 2 }}
              />
              <input
                value={plan.cost ?? ''}
                onChange={(e) => updateDayPlan(plan.key, { cost: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Cost"
                type="number"
                style={{ width: 90 }}
              />
              <button type="button" className="btn ghost small" onClick={() => removeDayPlan(plan.key)}>
                Delete
              </button>
            </div>
          ))}
          <button type="button" className="btn ghost small" onClick={addDayPlan} style={{ alignSelf: 'flex-start' }}>
            + Add a day
          </button>
        </div>
      </div>
      <button className="btn" disabled={submitting} onClick={submit}>
        {submitting ? 'Publishing…' : 'Publish travel note'}
      </button>
    </div>
  );
}
