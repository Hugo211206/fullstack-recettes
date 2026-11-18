import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/useAuth';
import RecipeForm from '../components/RecipeForm';
import { EMPTY_RECIPE_VALUES, recipeToFormValues } from '../utils/recipe';

function RecipeEditor() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState({ id: null, recipe: null, error: '' });

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    let ignore = false;

    apiFetch(`/recipes/${id}`)
      .then((recipe) => {
        if (!ignore) {
          setLoaded({ id, recipe, error: '' });
        }
      })
      .catch((err) => {
        if (!ignore) {
          const notFound = err.status === 404 || err.status === 400;
          setLoaded({
            id,
            recipe: null,
            error: notFound ? "Cette recette n'existe pas ou a été supprimée." : err.message,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  async function createRecipe(data) {
    const created = await apiFetch('/recipes', { method: 'POST', body: data });
    navigate(`/recipes/${created.id}`, { replace: true });
  }

  async function updateRecipe(data) {
    const updated = await apiFetch(`/recipes/${id}`, { method: 'PATCH', body: data });
    navigate(`/recipes/${updated.id}`, { replace: true });
  }

  if (!isEdit) {
    return (
      <main className="container">
        <Link to="/" className="back-link">← Retour aux recettes</Link>
        <div className="card form-card">
          <h1>Nouvelle recette</h1>
          <RecipeForm
            key="new"
            initialValues={EMPTY_RECIPE_VALUES}
            submitLabel="Publier la recette"
            cancelTo="/"
            onSubmit={createRecipe}
          />
        </div>
      </main>
    );
  }

  if (loaded.id !== id) {
    return (
      <main className="container">
        <p className="loading">Chargement…</p>
      </main>
    );
  }

  const forbidden = loaded.recipe && loaded.recipe.ownerId !== user.id;

  if (loaded.error || forbidden) {
    return (
      <main className="container">
        <Link to="/" className="back-link">← Retour aux recettes</Link>
        <p className="alert alert-error" role="alert">
          {loaded.error || 'Vous ne pouvez modifier que vos propres recettes.'}
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <Link to={`/recipes/${id}`} className="back-link">← Retour à la recette</Link>
      <div className="card form-card">
        <h1>Modifier la recette</h1>
        <RecipeForm
          key={id}
          initialValues={recipeToFormValues(loaded.recipe)}
          submitLabel="Enregistrer les modifications"
          cancelTo={`/recipes/${id}`}
          onSubmit={updateRecipe}
        />
      </div>
    </main>
  );
}

export default RecipeEditor;
