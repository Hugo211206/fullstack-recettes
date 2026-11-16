const recipes = [];
let nextId = 1;

function listRecipes() {
  return recipes;
}

function createRecipe(data) {
  const recipe = { id: String(nextId), ...data };
  nextId++;
  recipes.push(recipe);
  return recipe;
}

module.exports = { listRecipes, createRecipe };