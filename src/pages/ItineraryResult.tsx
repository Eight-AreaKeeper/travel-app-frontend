import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adjustItem, exportPlanPdf, getAlternatives, getPlan, getPlanStatus, regeneratePlan } from '../api/itinerary';
import type { Alternative, ApiError, ItineraryPlan } from '../api/types';
import { Loading, EmptyState, ErrorBanner } from '../components/Feedback';
import { toast } from '../components/Toast';
import { currency } from '../lib/format';

const CATEGORY_LABELS: Record<string, string> = {
  scenic: '🏞️ Attraction',
  food: '🍜 Food',
  transport: '🚗 Transport',
  hotel: '🏨 Hotel',
  other: '📍 Other',
};

const LOADING_CAPTIONS = ['Planning your itinerary…', 'Matching accommodations within your budget…', 'Organizing your daily routes…', 'AI is generating custom copy…'];
// Corresponds to API Reference 5.2: recommended polling interval is 2 seconds, max polling time 90 seconds
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90000;

type GenStatus = 'checking' | 'generating' | 'generated' | 'failed';

export function ItineraryResult() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<GenStatus>('checking');
  const [caption, setCaption] = useState(LOADING_CAPTIONS[0]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCost, setEditCost] = useState('');
  const [alternativesForItem, setAlternativesForItem] = useState<number | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [busy, setBusy] = useState(false);
  const [regenBudgetMin, setRegenBudgetMin] = useState('');
  const [regenBudgetMax, setRegenBudgetMax] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    getPlan(planId)
      .then(setPlan)
      .catch((e) => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  };

  // Itinerary generation is asynchronous: complete()/regenerate() return almost immediately, while the
  // actual generation runs in a backend queue. We poll the 5.2 status endpoint first, and don't fetch the
  // full detail (5.1) until the status settles (generated/failed) — otherwise, during the generating phase,
  // days would still be empty and could be mistaken for "this plan doesn't exist".
  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let captionTimer: ReturnType<typeof setInterval> | undefined;
    const startedAt = Date.now();

    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      if (captionTimer) clearInterval(captionTimer);
    };

    setGenStatus('checking');
    const checkStatus = () => {
      getPlanStatus(planId)
        .then((s) => {
          if (cancelled) return;
          if (s.status === 'generated') {
            setGenStatus('generated');
            stopPolling();
            load();
          } else if (s.status === 'failed') {
            setGenStatus('failed');
            stopPolling();
          } else {
            setGenStatus('generating');
            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
              stopPolling();
              toast("This is taking a while — check back later under 'My Trips'");
            }
          }
        })
        .catch((e: ApiError) => {
          if (cancelled) return;
          setGenStatus('failed');
          setError(e.message ?? 'Failed to check generation status');
          stopPolling();
        });
    };

    checkStatus();
    pollTimer = setInterval(checkStatus, POLL_INTERVAL_MS);
    let captionIndex = 0;
    captionTimer = setInterval(() => {
      captionIndex = (captionIndex + 1) % LOADING_CAPTIONS.length;
      setCaption(LOADING_CAPTIONS[captionIndex]);
    }, 1500);

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const retryGenerate = () => {
    if (!planId) return;
    setBusy(true);
    regeneratePlan(planId, {})
      .then((result) => navigate(`/itinerary/${result.planId}`))
      .catch((e: ApiError) => toast(e.message ?? 'Failed to regenerate'))
      .finally(() => setBusy(false));
  };

  if (genStatus === 'checking') return <Loading label="Checking generation status…" />;
  if (genStatus === 'generating') {
    return (
      <div className="customize-success">
        <div className="ticket" style={{ width: 320 }}>
          <div className="ticket-title">Generating your trip ticket…</div>
          <small>{caption}</small>
        </div>
      </div>
    );
  }
  if (genStatus === 'failed') {
    return (
      <div className="form-page">
        <ErrorBanner message={error ?? 'Itinerary generation failed, you can try again'} />
        <button className="btn" disabled={busy} onClick={retryGenerate} style={{ marginTop: 16 }}>
          Regenerate
        </button>
      </div>
    );
  }

  if (loading) return <Loading label="Loading itinerary plan…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!plan) return <EmptyState title="This itinerary plan was not found" />;

  const isMultiDestination = (plan.destinations?.length ?? 0) > 1;

  const startEdit = (itemId: number, title: string, cost: number | null) => {
    setAlternativesForItem(null);
    setEditingItemId(itemId);
    setEditTitle(title);
    setEditCost(cost == null ? '' : String(cost));
  };

  const saveEdit = () => {
    if (!planId || editingItemId == null) return;
    setBusy(true);
    adjustItem(planId, editingItemId, {
      action: 'edit',
      title: editTitle.trim() || undefined,
      estimatedCost: editCost.trim() ? Number(editCost) : undefined,
    })
      .then(() => {
        setEditingItemId(null);
        load();
      })
      .catch((e: ApiError) => toast(e.message ?? 'Failed to save'))
      .finally(() => setBusy(false));
  };

  const removeItem = (itemId: number) => {
    if (!planId) return;
    setBusy(true);
    adjustItem(planId, itemId, { action: 'remove' })
      .then(load)
      .catch((e: ApiError) => toast(e.message ?? 'Failed to delete'))
      .finally(() => setBusy(false));
  };

  const toggleAlternatives = (itemId: number) => {
    if (!planId) return;
    if (alternativesForItem === itemId) {
      setAlternativesForItem(null);
      return;
    }
    setEditingItemId(null);
    setAlternativesForItem(itemId);
    getAlternatives(planId, itemId)
      .then(setAlternatives)
      .catch((e: ApiError) => toast(e.message ?? 'Failed to get alternatives'));
  };

  const pickAlternative = (itemId: number, poiId: number) => {
    if (!planId) return;
    setBusy(true);
    adjustItem(planId, itemId, { action: 'replace', poiId })
      .then(() => {
        setAlternativesForItem(null);
        load();
      })
      .catch((e: ApiError) => toast(e.message ?? 'Failed to replace'))
      .finally(() => setBusy(false));
  };

  const regenerate = () => {
    if (!planId) return;
    setBusy(true);
    regeneratePlan(planId, {
      budgetMin: regenBudgetMin.trim() ? Number(regenBudgetMin) : undefined,
      budgetMax: regenBudgetMax.trim() ? Number(regenBudgetMax) : undefined,
    })
      .then((result) => navigate(`/itinerary/${result.planId}`))
      .catch((e: ApiError) => toast(e.message ?? 'Failed to regenerate'))
      .finally(() => setBusy(false));
  };

  const exportPdf = () => {
    if (!planId) return;
    setExporting(true);
    exportPlanPdf(planId)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `itinerary-${planId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((e: ApiError) => toast(e.message ?? 'Export failed'))
      .finally(() => setExporting(false));
  };

  return (
    <div className="form-page wide">
      <div className="ticket" style={{ marginBottom: 24 }}>
        <div className="ticket-title">
          {isMultiDestination ? plan.destinations!.map((d) => d.name).join(' · ') : plan.destination?.name ?? 'My Itinerary'}
          {' · '}
          {plan.days.length} days · v{plan.version}
        </div>
        <small>Estimated total cost {currency(plan.totalEstimatedCost)}</small>
      </div>

      {plan.days.map((day) => (
        <div key={day.dayNumber} style={{ marginBottom: 32 }}>
          <h3>
            Day {day.dayNumber}
            {isMultiDestination && day.destination ? ` · ${day.destination.name}` : ''}
            {day.date ? ` · ${day.date}` : ''}
            <small style={{ marginLeft: 12, color: 'var(--slate)' }}>
              Estimated cost {currency(day.dailyEstimatedCost)}
            </small>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {day.items.map((item) => (
              <div key={item.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 56, color: 'var(--slate)' }}>{item.startTime?.slice(0, 5) ?? ''}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {CATEGORY_LABELS[item.category] ?? item.category} · {item.title}
                      {item.userEdited && <small style={{ marginLeft: 8, color: 'var(--slate)' }}>Edited</small>}
                    </div>
                    {item.description && (
                      <div style={{ color: 'var(--slate)', fontSize: 14, marginTop: 4 }}>{item.description}</div>
                    )}
                  </div>
                  <div>{currency(item.estimatedCost)}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn ghost small" disabled={busy} onClick={() => startEdit(item.id, item.title, item.estimatedCost)}>
                    Edit
                  </button>
                  {item.category !== 'transport' && (
                    <button className="btn ghost small" disabled={busy} onClick={() => toggleAlternatives(item.id)}>
                      Swap
                    </button>
                  )}
                  <button className="btn ghost small" disabled={busy} onClick={() => removeItem(item.id)}>
                    Delete
                  </button>
                </div>

                {editingItemId === item.id && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" style={{ flex: 1 }} />
                    <input
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      placeholder="Cost"
                      type="number"
                      style={{ width: 100 }}
                    />
                    <button className="btn small" disabled={busy} onClick={saveEdit}>
                      Save
                    </button>
                    <button className="btn ghost small" onClick={() => setEditingItemId(null)}>
                      Cancel
                    </button>
                  </div>
                )}

                {alternativesForItem === item.id && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {alternatives.length === 0 ? (
                      <small style={{ color: 'var(--slate)' }}>No alternatives available</small>
                    ) : (
                      alternatives.map((alt) => (
                        <div
                          key={alt.poiId}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                        >
                          <div>
                            <strong>{alt.name}</strong>
                            <small style={{ marginLeft: 8, color: 'var(--slate)' }}>{alt.reason}</small>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{currency(alt.estimatedCost)}</span>
                            <button className="btn small" disabled={busy} onClick={() => pickAlternative(item.id, alt.poiId)}>
                              Choose
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Not happy with it? Adjust your budget and regenerate</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={regenBudgetMin}
            onChange={(e) => setRegenBudgetMin(e.target.value)}
            placeholder="Min budget"
            type="number"
            style={{ width: 120 }}
          />
          <input
            value={regenBudgetMax}
            onChange={(e) => setRegenBudgetMax(e.target.value)}
            placeholder="Max budget"
            type="number"
            style={{ width: 120 }}
          />
          <button className="btn" disabled={busy} onClick={regenerate}>
            Regenerate (edited items will be kept where possible)
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn ghost" disabled={exporting} onClick={exportPdf}>
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
        <button className="btn ghost" onClick={() => navigate('/trips')}>
          My Trips
        </button>
        <button className="btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
