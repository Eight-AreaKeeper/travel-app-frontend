import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotDestinations } from '../api/destinations';
import { listNotes } from '../api/notes';
import type { Destination, NoteSummary } from '../api/types';
import { NoteCard } from '../components/NoteCard';
import { Loading, EmptyState } from '../components/Feedback';

export function Home() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Destination[]>([]);
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    hotDestinations(8).then(setTags).catch(() => {});
    listNotes({ pageSize: 6 })
      .then((r) => setNotes(r.records))
      .catch(() => setNotes([]));
  }, []);

  const search = () => {
    const q = keyword.trim();
    navigate(q ? `/guides?keyword=${encodeURIComponent(q)}` : '/guides');
  };

  const featured = notes?.[0];

  return (
    <>
      <section className="hero">
        <div className="hero-form">
          <p className="eyebrow">TRAVEL, TOLD AS A TICKET</p>
          <h1>Where to?</h1>
          <input
            className="hero-search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Where to? Search destinations"
          />
          <div className="chip-scroll hero-tags">
            {tags.map((t) => (
              <button
                key={t.id}
                className="chip"
                onClick={() => navigate(`/guides?destinationId=${t.id}&name=${encodeURIComponent(t.name)}`)}
              >
                #{t.name}
              </button>
            ))}
          </div>
          <button className="btn" onClick={search}>
            Start exploring
          </button>
        </div>
        <aside className="ticket hero-ticket">
          {featured ? (
            <>
              <div className="ticket-title">{featured.title}</div>
              <small>YOUR NEXT JOURNEY</small>
              <div className="ticket-row">
                <span className="label">Likes</span>
                <span className="value">{featured.likeCount}</span>
              </div>
              <div className="ticket-row">
                <span className="label">Favorites</span>
                <span className="value">{featured.favoriteCount}</span>
              </div>
            </>
          ) : (
            <>
              <div className="ticket-title">No travel notes yet</div>
              <small>YOUR NEXT JOURNEY</small>
            </>
          )}
        </aside>
      </section>

      <section className="cta">
        Not sure where to go yet? Let us help you plan a custom itinerary
        <button className="btn" onClick={() => navigate('/customize')}>
          Start customizing
        </button>
      </section>

      <div className="section-head">
        <h2>Popular travel notes</h2>
      </div>
      {notes === null ? (
        <Loading />
      ) : notes.length === 0 ? (
        <EmptyState title="No travel notes yet" hint="Be the first to publish a travel note" />
      ) : (
        <div className="cards">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </>
  );
}
