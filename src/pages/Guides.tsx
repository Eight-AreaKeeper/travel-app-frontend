import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hotDestinations } from '../api/destinations';
import { listNotes } from '../api/notes';
import type { Destination, NoteSummary } from '../api/types';
import { NoteCard } from '../components/NoteCard';
import { Loading, EmptyState, ErrorBanner } from '../components/Feedback';

const PAGE_SIZE = 12;

type SortOption = 'recommend' | 'latest' | 'budget_asc';

export function Guides() {
  const [params, setParams] = useSearchParams();
  const destinationId = params.get('destinationId') ? Number(params.get('destinationId')) : undefined;
  const keyword = params.get('keyword') ?? '';
  const activeName = params.get('name') ?? '';
  const daysMin = params.get('daysMin') ? Number(params.get('daysMin')) : undefined;
  const daysMax = params.get('daysMax') ? Number(params.get('daysMax')) : undefined;
  const budgetMin = params.get('budgetMin') ? Number(params.get('budgetMin')) : undefined;
  const budgetMax = params.get('budgetMax') ? Number(params.get('budgetMax')) : undefined;
  const sort = (params.get('sort') as SortOption) || 'recommend';

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [daysMinInput, setDaysMinInput] = useState(daysMin?.toString() ?? '');
  const [daysMaxInput, setDaysMaxInput] = useState(daysMax?.toString() ?? '');
  const [budgetMinInput, setBudgetMinInput] = useState(budgetMin?.toString() ?? '');
  const [budgetMaxInput, setBudgetMaxInput] = useState(budgetMax?.toString() ?? '');
  const [hot, setHot] = useState<Destination[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hotDestinations(10).then(setHot).catch(() => {});
  }, []);

  useEffect(() => {
    setKeywordInput(keyword);
    setPage(1);
    setLoading(true);
    setError(null);
    listNotes({ destinationId, keyword: keyword || undefined, daysMin, daysMax, budgetMin, budgetMax, sort, page: 1, pageSize: PAGE_SIZE })
      .then((r) => {
        setNotes(r.records);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId, keyword, daysMin, daysMax, budgetMin, budgetMax, sort]);

  const loadMore = () => {
    const next = page + 1;
    listNotes({ destinationId, keyword: keyword || undefined, daysMin, daysMax, budgetMin, budgetMax, sort, page: next, pageSize: PAGE_SIZE }).then((r) => {
      setNotes((prev) => [...prev, ...r.records]);
      setPage(next);
    });
  };

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next);
  };

  const submitKeyword = () => updateParams({ keyword: keywordInput.trim() || undefined });
  const submitRangeFilters = () =>
    updateParams({
      daysMin: daysMinInput.trim() || undefined,
      daysMax: daysMaxInput.trim() || undefined,
      budgetMin: budgetMinInput.trim() || undefined,
      budgetMax: budgetMaxInput.trim() || undefined,
    });

  return (
    <div className="list-layout">
      <aside className="list-sidebar">
        <div className="field">
          <label>Search</label>
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitKeyword()}
            placeholder="Search by title or content"
          />
        </div>
        <div className="field">
          <label>Popular destinations</label>
          <div className="chip-row">
            {hot.map((d) => (
              <button
                key={d.id}
                className={`chip ${destinationId === d.id ? 'active' : ''}`}
                onClick={() => setParams({ destinationId: String(d.id), name: d.name })}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Trip length range</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={daysMinInput}
              onChange={(e) => setDaysMinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRangeFilters()}
              placeholder="Min"
              type="number"
              min={1}
            />
            <input
              value={daysMaxInput}
              onChange={(e) => setDaysMaxInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRangeFilters()}
              placeholder="Max"
              type="number"
              min={1}
            />
          </div>
        </div>
        <div className="field">
          <label>Budget per person range</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={budgetMinInput}
              onChange={(e) => setBudgetMinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRangeFilters()}
              placeholder="Min"
              type="number"
              min={0}
            />
            <input
              value={budgetMaxInput}
              onChange={(e) => setBudgetMaxInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRangeFilters()}
              placeholder="Max"
              type="number"
              min={0}
            />
          </div>
          <button className="btn ghost small" onClick={submitRangeFilters} style={{ marginTop: 8 }}>
            Apply range filters
          </button>
        </div>
        {(destinationId || keyword || daysMin || daysMax || budgetMin || budgetMax || sort !== 'recommend') && (
          <button
            className="btn ghost small"
            onClick={() => {
              setDaysMinInput('');
              setDaysMaxInput('');
              setBudgetMinInput('');
              setBudgetMaxInput('');
              setParams({});
            }}
          >
            Clear filters
          </button>
        )}
      </aside>

      <div>
        <div className="list-toolbar">
          <span>{activeName ? `Destination: ${activeName}` : keyword ? `Keyword: ${keyword}` : 'Recommended'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{total} results</span>
            <select value={sort} onChange={(e) => updateParams({ sort: e.target.value === 'recommend' ? undefined : e.target.value })}>
              <option value="recommend">Recommended</option>
              <option value="latest">Newest</option>
              <option value="budget_asc">Budget per person: low to high</option>
            </select>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? (
          <Loading />
        ) : notes.length === 0 ? (
          <EmptyState
            title={`No guides for "${activeName || keyword || 'this'}" yet`}
            hint="Try a different keyword, or check out the popular destinations below"
          />
        ) : (
          <>
            <div className="cards">
              {notes.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
            {notes.length < total && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn ghost" onClick={loadMore}>
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
