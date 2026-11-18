import { Link } from 'react-router-dom';
import { categoryLabel, formatPrepTime } from '../utils/recipe';

function RecipeCard({ recipe, isMine }) {
  return (
    <article className="recipe-card">
      <div className="recipe-card-header">
        <h2 className="recipe-card-title">
          <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h2>
        {recipe.favorite && (
          <span className="favorite-star" role="img" aria-label="Favori">★</span>
        )}
      </div>
      <div className="recipe-card-meta">
        <span className={`badge badge-${recipe.category}`}>{categoryLabel(recipe.category)}</span>
        <span className="prep-time">⏱ {formatPrepTime(recipe.prepTime)}</span>
        {isMine && <span className="badge badge-mine">Ma recette</span>}
      </div>
    </article>
  );
}

export default RecipeCard;
