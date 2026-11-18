const Recipe = require('../models/recipe.model');
const AppError = require('../utils/AppError');

const AUTHOR = { path: 'ownerId', select: 'username' };

function recipeNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Recette introuvable');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listRecipes(userId, filters) {
  const query = {};

  if (filters.category !== undefined) {
    query.category = filters.category;
  }
  if (filters.favorite !== undefined) {
    query.favorite = filters.favorite;
  }
  if (filters.mine) {
    query.ownerId = userId;
  }
  if (filters.q !== undefined) {
    query.title = { $regex: escapeRegex(filters.q), $options: 'i' };
  }

  const { page, limit } = filters;

  const [items, total] = await Promise.all([
    Recipe.find(query)
      .populate(AUTHOR)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Recipe.countDocuments(query),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

async function createRecipe(ownerId, data) {
  const recipe = await Recipe.create({ ...data, ownerId });
  return recipe.populate(AUTHOR);
}

async function getRecipeById(id) {
  const recipe = await Recipe.findById(id).populate(AUTHOR);
  if (!recipe) {
    throw recipeNotFound();
  }
  return recipe;
}

async function updateRecipe(ownerId, id, data) {
  const recipe = await Recipe.findOneAndUpdate({ _id: id, ownerId }, data, {
    returnDocument: 'after',
    runValidators: true,
  }).populate(AUTHOR);
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
