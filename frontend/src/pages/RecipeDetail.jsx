import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/useAuth';
import { categoryLabel, formatDate, formatPrepTime } from '../utils/recipe';

function RecipeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState({ id: null, recipe: null, error: '' });
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;

    apiFetch(`/recipes/${id}`)
      .then((recipe) => {
        if (!ignore) {
          setResult({ id, recipe, error: '' });
        }
      })
      .catch((err) => {
        if (!ignore) {
          const notFound = err.status === 404 || err.status === 400;
          setResult({
            id,
            recipe: null,
            error: notFound ? "Cette recette n'existe pas ou a été supprimée." : err.message,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (result.id !== id) {
    return (
      <main className="container">
        <p className="loading">Chargement…</p>
      </main>
    );
  }

  if (result.error) {
    return (
      <main className="container">
        <Link to="/" className="back-link">← Retour aux recettes</Link>
        <p className="alert alert-error" role="alert">{result.error}</p>
      </main>
    );
  }

  const { recipe } = result;
  const isMine = recipe.ownerId === user.id;
  const ingredients = recipe.ingredients
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  async function toggleFavorite() {
    setBusy(true);
    setActionError('');
    try {
      const updated = await apiFetch(`/recipes/${id}`, {
        method: 'PATCH',
        body: { favorite: !recipe.favorite },
      });
      setResult({ id, recipe: updated, error: '' });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement « ${recipe.title} » ?`)) {
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      await apiFetch(`/recipes/${id}`, { method: 'DELETE' });
      navigate('/', { replace: true });
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <Link to="/" className="back-link">← Retour aux recettes</Link>

      <article className="card recipe-detail">
        <header className="recipe-detail-header">
          <div>
            <h1>{recipe.title}</h1>
            <div className="recipe-card-meta">
              <span className={`badge badge-${recipe.category}`}>{categoryLabel(recipe.category)}</span>
              <span className="prep-time">⏱ {formatPrepTime(recipe.prepTime)}</span>
              {recipe.favorite && (
                <span className="favorite-star" role="img" aria-label="Favori">★</span>
              )}
              {isMine && <span className="badge badge-mine">Ma recette</span>}
            </div>
          </div>

          {isMine && (
            <div className="recipe-actions">
              <button
                type="button"
                className="btn btn-secondary btn-favorite"
                aria-pressed={recipe.favorite}
                onClick={toggleFavorite}
                disabled={busy}
              >
                {recipe.favorite ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
              </button>
              <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-secondary">Modifier</Link>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
                Supprimer
              </button>
            </div>
          )}
        </header>

        {actionError && <p className="alert alert-error" role="alert">{actionError}</p>}

        <section className="recipe-section">
          <h2>Ingrédients</h2>
          {ingredients.length > 0 ? (
            <ul className="ingredient-list">
              {ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Aucun ingrédient renseigné.</p>
          )}
        </section>

        <section className="recipe-section">
          <h2>Préparation</h2>
          {recipe.instructions ? (
            <p className="recipe-instructions">{recipe.instructions}</p>
          ) : (
            <p className="muted">Aucune instruction renseignée.</p>
          )}
        </section>

        <footer className="recipe-detail-footer muted">
          Publiée le {formatDate(recipe.createdAt)}
          {recipe.updatedAt !== recipe.createdAt && ` · modifiée le ${formatDate(recipe.updatedAt)}`}
        </footer>
      </article>
    </main>
  );
}

export default RecipeDetail;
