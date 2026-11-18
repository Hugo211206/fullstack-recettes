export const CATEGORIES = [
  { value: 'starter', label: 'Entrée' },
  { value: 'main', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Boisson' },
];

export function categoryLabel(value) {
  const category = CATEGORIES.find((item) => item.value === value);
  return category ? category.label : value;
}

export function formatPrepTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }
  if (rest === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${String(rest).padStart(2, '0')}`;
}

export const EMPTY_RECIPE_VALUES = {
  title: '',
  category: '',
  hours: '',
  minutes: '',
  ingredients: '',
  instructions: '',
  favorite: false,
};

export function recipeToFormValues(recipe) {
  return {
    title: recipe.title,
    category: recipe.category,
    hours: String(Math.floor(recipe.prepTime / 60)),
    minutes: String(recipe.prepTime % 60),
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    favorite: recipe.favorite,
  };
}

export function authorName(recipe) {
  return recipe.author?.username ?? null;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
