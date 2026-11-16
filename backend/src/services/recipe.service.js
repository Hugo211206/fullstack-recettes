const Recipe = require('../models/recipe.model');
const AppError = require('../utils/AppError');

async function listRecipes() {
  return Recipe.find().sort({ createdAt: -1 });
}

async function createRecipe(data) {
  return Recipe.create(data);
}

async function getRecipeById(id) {
  const recipe = await Recipe.findById(id);
  if (!recipe) {
    throw new AppError(404, 'NOT_FOUND', 'Recette introuvable');
  }
  return recipe;
}

async function updateRecipe(id, data) {
  const recipe = await Recipe.findByIdAndUpdate(id, data, {
    returnDocument: 'after', // renvoie la recette APRÈS modification
    runValidators: true, // applique aussi les règles du schéma à la mise à jour
  });
  if (!recipe) {
    throw new AppError(404, 'NOT_FOUND', 'Recette introuvable');
  }
  return recipe;
}

async function deleteRecipe(id) {
  const recipe = await Recipe.findByIdAndDelete(id);
  if (!recipe) {
    throw new AppError(404, 'NOT_FOUND', 'Recette introuvable');
  }
}

module.exports = { listRecipes, createRecipe, getRecipeById, updateRecipe, deleteRecipe };