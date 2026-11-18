import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">RecettesX</Link>
        {user && (
          <nav className="navbar-links" aria-label="Navigation principale">
            <Link to="/recipes/new" className="btn btn-primary navbar-new">+ Nouvelle recette</Link>
            <span className="navbar-user">{user.email}</span>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Déconnexion
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;