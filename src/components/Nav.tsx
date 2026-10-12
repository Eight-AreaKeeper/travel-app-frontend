import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function Nav() {
  const { accessToken, user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          TravelPass
        </Link>
        <div className="nav-links">
          <Link to="/guides">Travel Notes & Guides</Link>
          <Link to="/notes/new">Post a Travel Note</Link>
          <Link to="/customize">Customize My Trip</Link>
          {accessToken ? (
            <div className="nav-user">
              <Link to="/favorites">My Favorites</Link>
              <Link to="/trips">My Trips</Link>
              <Link to="/profile">{user?.nickname ?? 'My Account'}</Link>
              <button
                className="btn ghost small"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link to="/login">Log In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
