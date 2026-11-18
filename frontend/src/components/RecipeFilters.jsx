import { CATEGORIES } from '../utils/recipe';

function RecipeFilters({ category, q, favorite, showFavorite, onChange }) {
  function handleSearch(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q').trim();
    onChange('q', value);
  }

  return (
    <div className="filters">
      <form className="filters-search" role="search" onSubmit={handleSearch}>
        <div className="field">
          <label htmlFor="search">Rechercher un titre</label>
          <input
            key={q}
            id="search"
            name="q"
            type="search"
            maxLength={120}
            defaultValue={q}
            placeholder="ex. tarte"
          />
        </div>
        <button type="submit" className="btn btn-secondary">Rechercher</button>
      </form>

      <div className="field">
        <label htmlFor="category">Catégorie</label>
        <select id="category" value={category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="">Toutes</option>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {showFavorite && (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(event) => onChange('favorite', event.target.checked ? 'true' : '')}
          />
          Mes favoris uniquement
        </label>
      )}
    </div>
  );
}

export default RecipeFilters;
