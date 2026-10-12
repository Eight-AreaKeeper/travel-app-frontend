import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFavorites } from '../api/user';
import type { NoteSummary } from '../api/types';
import { NoteCard } from '../components/NoteCard';
import { Loading, EmptyState, ErrorBanner } from '../components/Feedback';
import { isLoggedIn } from '../store/auth';

const PAGE_SIZE = 12;

export function Favorites() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    listFavorites(1, PAGE_SIZE)
      .then((r) => {
        setNotes(r.records);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn()) {
    return (
      <div className="form-page">
        <EmptyState title="Log in to view your favorites" />
        <button className="btn" onClick={() => navigate('/login')}>
          Log in
        </button>
      </div>
    );
  }

  const loadMore = () => {
    const next = page + 1;
    listFavorites(next, PAGE_SIZE).then((r) => {
      setNotes((prev) => [...prev, ...r.records]);
      setPage(next);
    });
  };

  return (
    <div>
      <div className="list-toolbar">
        <span>My Favorites</span>
        <span>{total} total</span>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Loading />
      ) : notes.length === 0 ? (
        <EmptyState title="No favorites yet" hint="Browse travel notes and guides to find something you like" />
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
  );
}
