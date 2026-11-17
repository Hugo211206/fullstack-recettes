const Recipe = require('../models/recipe.model');
const AppError = require('../utils/AppError');

function recipeNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Recette introuvable');
}

async function listRecipes() {
  return Recipe.find().sort({ createdAt: -1 });
}

async function createRecipe(ownerId, data) {
  return Recipe.create({ ...data, ownerId });
}

async function getRecipeById(id) {
  const recipe = await Recipe.findById(id);
  if (!recipe) {
    throw recipeNotFound();
  }
  return recipe;
}

async function updateRecipe(ownerId, id, data) {
  const recipe = await Recipe.findOneAndUpdate({ _id: id, ownerId }, data, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!recipe) {
    throw recipeNotFound();
  }
  return recipe;
}

async function deleteRecipe(ownerId, id) {
  const recipe = await Recipe.findOneAndDelete({ _id: id, ownerId });
  if (!recipe) {
    throw recipeNotFound();
  }
}

module.exports = { listRecipes, createRecipe, getRecipeById, updateRecipe, deleteRecipe };
