const Recipe = require('../models/recipe.model');
const AppError = require('../utils/AppError');

const AUTHOR = { path: 'ownerId', select: 'username' };

function recipeNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Recette introuvable');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toResponse(recipe, userId) {
  const favoritedBy = recipe.favoritedBy ?? [];
  return {
    ...recipe.toJSON(),
    favorite: favoritedBy.some((id) => id.toString() === userId),
    favoritesCount: favoritedBy.length,
  };
}

async function listRecipes(userId, filters) {
  const query = {};

  if (filters.category !== undefined) {
    query.category = filters.category;
  }
  if (filters.favorite !== undefined) {
    query.favoritedBy = filters.favorite ? userId : { $ne: userId };
  }
  if (filters.mine) {
    query.ownerId = userId;
  }
  if (filters.q !== undefined) {
    query.title = { $regex: escapeRegex(filters.q), $options: 'i' };
  }

  const { page, limit } = filters;

  const [recipes, total] = await Promise.all([
    Recipe.find(query)
      .populate(AUTHOR)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Recipe.countDocuments(query),
  ]);

  return {
    items: recipes.map((recipe) => toResponse(recipe, userId)),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function createRecipe(ownerId, data) {
  const recipe = await Recipe.create({ ...data, ownerId });
  await recipe.populate(AUTHOR);
  return toResponse(recipe, ownerId);
}

async function getRecipeById(userId, id) {
  const recipe = await Recipe.findById(id).populate(AUTHOR);
  if (!recipe) {
    throw recipeNotFound();
  }
  return toResponse(recipe, userId);
}

async function updateRecipe(ownerId, id, data) {
  const recipe = await Recipe.findOneAndUpdate({ _id: id, ownerId }, data, {
    returnDocument: 'after',
    runValidators: true,
  }).populate(AUTHOR);
  if (!recipe) {
    throw recipeNotFound();
  }
  return toResponse(recipe, ownerId);
}

async function deleteRecipe(ownerId, id) {
  const recipe = await Recipe.findOneAndDelete({ _id: id, ownerId });
  if (!recipe) {
    throw recipeNotFound();
  }
}

async function setFavorite(userId, id, isFavorite) {
  const change = isFavorite ? { $addToSet: { favoritedBy: userId } } : { $pull: { favoritedBy: userId } };
  const recipe = await Recipe.findByIdAndUpdate(id, change, { returnDocument: 'after' }).populate(AUTHOR);
  if (!recipe) {
    throw recipeNotFound();
  }
  return toResponse(recipe, userId);
}

module.exports = { listRecipes, createRecipe, getRecipeById, updateRecipe, deleteRecipe, setFavorite };
