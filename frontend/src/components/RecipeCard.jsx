import { Link } from 'react-router-dom';
import { authorName, categoryLabel, formatPrepTime } from '../utils/recipe';

function RecipeCard({ recipe, isMine }) {
  return (
    <article className="recipe-card">
      <div className="recipe-card-header">
        <h2 className="recipe-card-title">
          <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h2>
        {recipe.favoritesCount > 0 && (
          <span
            className={`favorite-count${recipe.favorite ? ' is-favorite' : ''}`}
            aria-label={`${recipe.favoritesCount} favori${recipe.favoritesCount > 1 ? 's' : ''}${recipe.favorite ? ', dont vous' : ''}`}
          >
            ★ {recipe.favoritesCount}
          </span>
        )}
      </div>
      <p className="recipe-card-author">
        {authorName(recipe) ? (
          <>par <strong>{authorName(recipe)}</strong></>
        ) : (
          <span className="author-anonymous">Utilisateur anonyme</span>
        )}
      </p>
      <div className="recipe-card-meta">
        <span className={`badge badge-${recipe.category}`}>{categoryLabel(recipe.category)}</span>
        <span className="prep-time">⏱ {formatPrepTime(recipe.prepTime)}</span>
        {isMine && <span className="badge badge-mine">Ma recette</span>}
      </div>
    </article>
  );
}

export default RecipeCard;
