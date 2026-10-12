import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  favoriteNote,
  getNote,
  createComment,
  listComments,
  likeNote,
  unfavoriteNote,
  unlikeNote,
} from '../api/notes';
import { ApiError } from '../api/types';
import type { Comment, NoteDetail as NoteDetailType } from '../api/types';
import { isLoggedIn } from '../store/auth';
import { relativeTime } from '../lib/format';
import { Loading, ErrorBanner } from '../components/Feedback';
import { toast } from '../components/Toast';

export function NoteDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<NoteDetailType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNote(id)
      .then(setNote)
      .catch((e) => setError(e.message ?? 'This travel note does not exist'));
    listComments(id)
      .then((r) => setComments(r.records))
      .catch(() => {});
  }, [id]);

  const requireLogin = () => {
    if (isLoggedIn()) return true;
    toast('Please log in first');
    navigate('/login');
    return false;
  };

  const toggleLike = () => {
    if (!note || !requireLogin()) return;
    const liked = note.liked;
    setNote({ ...note, liked: !liked, likeCount: note.likeCount + (liked ? -1 : 1) });
    (liked ? unlikeNote(id) : likeNote(id)).catch((e: ApiError) => {
      setNote((prev) => (prev ? { ...prev, liked, likeCount: prev.likeCount + (liked ? 1 : -1) } : prev));
      toast(e.message ?? 'Action failed');
    });
  };

  const toggleFavorite = () => {
    if (!note || !requireLogin()) return;
    const favorited = note.favorited;
    setNote({ ...note, favorited: !favorited, favoriteCount: note.favoriteCount + (favorited ? -1 : 1) });
    (favorited ? unfavoriteNote(id) : favoriteNote(id)).catch((e: ApiError) => {
      setNote((prev) =>
        prev ? { ...prev, favorited, favoriteCount: prev.favoriteCount + (favorited ? 1 : -1) } : prev,
      );
      toast(e.message ?? 'Action failed');
    });
  };

  const submitComment = () => {
    if (!requireLogin()) return;
    const content = commentInput.trim();
    if (!content) return;
    createComment(id, content)
      .then((c) => {
        setComments((prev) => [c, ...prev]);
        setCommentInput('');
      })
      .catch((e: ApiError) => toast(e.message ?? 'Failed to post comment'));
  };

  if (error) return <ErrorBanner message={error} />;
  if (!note) return <Loading />;

  return (
    <div className="detail-layout">
      <article>
        <button className="btn ghost small" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>{note.title}</h1>
        <div className="detail-author">
          {note.authorAvatarUrl && <img src={note.authorAvatarUrl} alt={note.authorNickname} />}
          <span>
            {note.authorNickname} · Published {relativeTime(note.createdAt)}
          </span>
        </div>
        {note.coverImage ? (
          <img className="detail-cover" src={note.coverImage} alt={note.title} />
        ) : (
          <div className="detail-cover" />
        )}
        <p className="detail-content">{note.content}</p>

        {note.tags.length > 0 && (
          <div className="chip-row" style={{ margin: '16px 0' }}>
            {note.tags.map((t) => (
              <span key={t} className="tag-pill">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="detail-actions">
          <button className={`icon-btn ${note.liked ? 'active' : ''}`} onClick={toggleLike}>
            ♥ Like {note.likeCount}
          </button>
          <button className={`icon-btn ${note.favorited ? 'active' : ''}`} onClick={toggleFavorite}>
            ☆ Favorite {note.favoriteCount}
          </button>
        </div>

        <section className="comments">
          <h2>Comments ({comments.length})</h2>
          <div className="comment-form">
            <input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Share your travel thoughts"
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button className="btn" onClick={submitComment}>
              Post
            </button>
          </div>
          <div className="comment-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-meta">
                  {c.authorAvatarUrl && (
                    <img
                      src={c.authorAvatarUrl}
                      alt={c.authorNickname}
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                  )}
                  <span>{c.authorNickname}</span>
                  <span>· {relativeTime(c.createdAt)}</span>
                </div>
                <p style={{ margin: 0 }}>{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <aside className="detail-sidebar">
        <div className="ticket">
          <div className="ticket-title">Trip at a Glance</div>
          <small>TRIP AT A GLANCE</small>
          <div className="ticket-row">
            <span className="label">Author</span>
            <span className="value">{note.authorNickname}</span>
          </div>
          {note.destination && (
            <div className="ticket-row">
              <span className="label">Destination</span>
              <span className="value">{note.destination.name}</span>
            </div>
          )}
          {note.days != null && (
            <div className="ticket-row">
              <span className="label">Days</span>
              <span className="value">{note.days} days</span>
            </div>
          )}
          {note.budgetPerPerson != null && (
            <div className="ticket-row">
              <span className="label">Cost per person</span>
              <span className="value">¥{note.budgetPerPerson}</span>
            </div>
          )}
          {note.transportType && (
            <div className="ticket-row">
              <span className="label">Transport</span>
              <span className="value">{note.transportType}</span>
            </div>
          )}
          {note.bestSeason && (
            <div className="ticket-row">
              <span className="label">Best season</span>
              <span className="value">{note.bestSeason}</span>
            </div>
          )}
          <div className="ticket-row">
            <span className="label">Views</span>
            <span className="value">{note.viewCount ?? 0}</span>
          </div>
          <div className="ticket-row">
            <span className="label">Likes</span>
            <span className="value">{note.likeCount}</span>
          </div>
          <div className="ticket-row">
            <span className="label">Favorites</span>
            <span className="value">{note.favoriteCount}</span>
          </div>
          <div className="ticket-row">
            <span className="label">Comments</span>
            <span className="value">{note.commentCount}</span>
          </div>
        </div>

        {note.dayPlans && note.dayPlans.length > 0 && (
          <div className="ticket" style={{ marginTop: 16 }}>
            <div className="ticket-title">Daily Route</div>
            {note.dayPlans.map((d) => (
              <div key={d.dayNumber} className="ticket-row" style={{ alignItems: 'flex-start' }}>
                <span className="label">Day {d.dayNumber}</span>
                <span className="value" style={{ textAlign: 'right' }}>
                  {d.title}
                  {d.cost != null && <small style={{ display: 'block', color: 'var(--slate)' }}>~¥{d.cost}</small>}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          className="btn"
          onClick={() => navigate(`/customize?sourceNoteId=${note.id}&destinationId=${note.destinationId}`)}
        >
          Generate a similar custom itinerary
        </button>
      </aside>
    </div>
  );
}
