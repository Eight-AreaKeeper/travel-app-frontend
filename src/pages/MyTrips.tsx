import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyPlans } from '../api/itinerary';
import type { ItineraryPlanSummary } from '../api/types';
import { Loading, EmptyState, ErrorBanner } from '../components/Feedback';
import { isLoggedIn } from '../store/auth';
import { currency, relativeTime } from '../lib/format';

const PAGE_SIZE = 10;

export function MyTrips() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ItineraryPlanSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    listMyPlans(1, PAGE_SIZE)
      .then((r) => {
        setPlans(r.records);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn()) {
    return (
      <div className="form-page">
        <EmptyState title="Log in to view your trips" />
        <button className="btn" onClick={() => navigate('/login')}>
          Log in
        </button>
      </div>
    );
  }

  const loadMore = () => {
    const next = page + 1;
    listMyPlans(next, PAGE_SIZE).then((r) => {
      setPlans((prev) => [...prev, ...r.records]);
      setPage(next);
    });
  };

  return (
    <div className="form-page wide">
      <div className="list-toolbar">
        <span>My Trips</span>
        <span>{total} plans total</span>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Loading />
      ) : plans.length === 0 ? (
        <EmptyState title="You haven't generated any itinerary plans yet" hint="Try answering a few questions in 'Customize My Trip'" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="card"
                style={{ padding: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => navigate(`/itinerary/${plan.id}`)}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {plan.destination?.name ?? 'Unknown destination'} · {plan.days} days · v{plan.version}
                  </div>
                  <small style={{ color: 'var(--slate)' }}>{relativeTime(plan.createdAt)}</small>
                </div>
                <div>{currency(plan.totalEstimatedCost)}</div>
              </div>
            ))}
          </div>
          {plans.length < total && (
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
