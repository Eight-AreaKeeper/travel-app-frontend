import { Link } from 'react-router-dom';
import type { NoteSummary } from '../api/types';

export function NoteCard({ note }: { note: NoteSummary }) {
  return (
    <Link className="card" to={`/guides/${note.id}`}>
      <div className="card-photo-wrap">
        {note.coverImage ? (
          <img className="card-photo" src={note.coverImage} alt={note.title} loading="lazy" />
        ) : (
          <div className="card-photo" />
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{note.title}</h3>
        {(note.days != null || note.budgetPerPerson != null) && (
          <div className="card-meta">
            {note.days != null && <span>{note.days} days</span>}
            {note.budgetPerPerson != null && <span>¥{note.budgetPerPerson}/person</span>}
          </div>
        )}
        <div className="card-meta">
          <span>♥ {note.likeCount}</span>
          <span>☆ {note.favoriteCount}</span>
          <span>💬 {note.commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
