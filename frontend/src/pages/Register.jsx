import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container auth-page">
      <div className="card auth-card">
        <h1>Créer un compte</h1>
        <p className="auth-subtitle">Partagez vos recettes avec la communauté.</p>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span id="password-hint" className="field-hint">8 caractères minimum</span>
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Création…' : 'Créer un compte'}
          </button>
        </form>
        <p className="auth-switch">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
