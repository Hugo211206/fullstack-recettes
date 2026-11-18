const recipeService = require('../services/recipe.service');

async function list(req, res) {
  const result = await recipeService.listRecipes(req.user.id, req.filters);
  res.status(200).json(result);
}

async function create(req, res) {
  const recipe = await recipeService.createRecipe(req.user.id, req.body);
  res.status(201).json(recipe);
}

async function getOne(req, res) {
  const recipe = await recipeService.getRecipeById(req.user.id, req.params.id);
  res.status(200).json(recipe);
}

async function update(req, res) {
  const recipe = await recipeService.updateRecipe(req.user.id, req.params.id, req.body);
  res.status(200).json(recipe);
}

async function remove(req, res) {
  await recipeService.deleteRecipe(req.user.id, req.params.id);
  res.status(204).end();
}

async function addFavorite(req, res) {
  const recipe = await recipeService.setFavorite(req.user.id, req.params.id, true);
  res.status(200).json(recipe);
}

async function removeFavorite(req, res) {
  const recipe = await recipeService.setFavorite(req.user.id, req.params.id, false);
  res.status(200).json(recipe);
}

module.exports = { list, create, getOne, update, remove, addFavorite, removeFavorite };
