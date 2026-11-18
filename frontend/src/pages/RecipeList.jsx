import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/useAuth';
import RecipeCard from '../components/RecipeCard';
import RecipeFilters from '../components/RecipeFilters';

function recipesUrl(query, page) {
  const params = new URLSearchParams(query);
  params.set('page', String(page));
  return `/recipes?${params.toString()}`;
}

function RecipeList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();
  const [result, setResult] = useState({ query: null, items: [], page: 0, totalPages: 0, total: 0, error: '' });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');

  useEffect(() => {
    let ignore = false;

    apiFetch(recipesUrl(query, 1))
      .then((data) => {
        if (!ignore) {
          setResult({
            query,
            items: data.items,
            page: data.page,
            totalPages: data.totalPages,
            total: data.total,
            error: '',
          });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ query, items: [], page: 0, totalPages: 0, total: 0, error: err.message });
        }
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  async function loadMore() {
    setLoadingMore(true);
    setMoreError('');
    try {
      const data = await apiFetch(recipesUrl(query, result.page + 1));
      setResult((current) => {
        if (current.query !== query) {
          return current;
        }
        const known = new Set(current.items.map((recipe) => recipe.id));
        return {
          ...current,
          items: [...current.items, ...data.items.filter((recipe) => !known.has(recipe.id))],
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
        };
      });
    } catch (err) {
      setMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  const loading = result.query !== query;
  const hasMore = result.page < result.totalPages;
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
        showFavorite
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
            {result.total} recette{result.total > 1 ? 's' : ''}
          </p>
          <ul className="recipe-grid">
            {result.items.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} isMine={recipe.ownerId === user.id} />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="load-more">
              <p className="load-more-info">
                {result.items.length} sur {result.total} recettes affichées
              </p>
              {moreError && <p className="alert alert-error" role="alert">{moreError}</p>}
              <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Chargement…' : 'Voir plus de recettes'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default RecipeList;
