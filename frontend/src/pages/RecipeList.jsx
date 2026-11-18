import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/useAuth';
import RecipeCard from '../components/RecipeCard';
import RecipeFilters from '../components/RecipeFilters';

function RecipeList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();
  const [result, setResult] = useState({ query: null, items: [], error: '' });

  useEffect(() => {
    let ignore = false;

    apiFetch(query ? `/recipes?${query}` : '/recipes')
      .then((data) => {
        if (!ignore) {
          setResult({ query, items: data.items, error: '' });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ query, items: [], error: err.message });
        }
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  const loading = result.query !== query;
  const mine = searchParams.get('mine') === 'true';
  const hasFilters = searchParams.has('category') || searchParams.has('q') || searchParams.has('favorite');

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    setSearchParams(next);
  }

  function showTab(onlyMine) {
    const next = new URLSearchParams(searchParams);
    if (onlyMine) {
      next.set('mine', 'true');
    } else {
      next.delete('mine');
      next.delete('favorite');
    }
    setSearchParams(next);
  }

  return (
    <main className="container">
      <div className="page-header">
        <h1>{mine ? 'Mes recettes' : 'Les recettes de la communauté'}</h1>
      </div>

      <div className="feed-tabs" role="group" aria-label="Recettes affichées">
        <button type="button" className="feed-tab" aria-pressed={!mine} onClick={() => showTab(false)}>
          Toutes les recettes
        </button>
        <button type="button" className="feed-tab" aria-pressed={mine} onClick={() => showTab(true)}>
          Mes recettes
        </button>
      </div>

      <RecipeFilters
        category={searchParams.get('category') ?? ''}
        q={searchParams.get('q') ?? ''}
        favorite={searchParams.get('favorite') === 'true'}
        showFavorite={mine}
        onChange={updateFilter}
      />

      {loading && <p className="loading">Chargement…</p>}

      {!loading && result.error && (
        <p className="alert alert-error" role="alert">{result.error}</p>
      )}

      {!loading && !result.error && result.items.length === 0 && (
        <p className="empty-state">
          {hasFilters
            ? 'Aucune recette ne correspond à ces filtres.'
            : mine
              ? "Vous n'avez pas encore publié de recette."
              : "Aucune recette n'a encore été publiée."}
        </p>
      )}

      {!loading && !result.error && result.items.length > 0 && (
        <>
          <p className="results-count" aria-live="polite">
            {result.items.length} recette{result.items.length > 1 ? 's' : ''}
          </p>
          <ul className="recipe-grid">
            {result.items.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} isMine={recipe.ownerId === user.id} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default RecipeList;
