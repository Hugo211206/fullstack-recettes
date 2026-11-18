const express = require('express');
const recipeController = require('../controllers/recipe.controller');
const { validateCreateRecipe, validateUpdateRecipe, validateId, validateListQuery } = require('../validators/recipe.validator');

const router = express.Router();

router.get('/', validateListQuery, recipeController.list);
router.post('/', validateCreateRecipe, recipeController.create);
router.get('/:id', validateId, recipeController.getOne);
router.patch('/:id', validateId, validateUpdateRecipe, recipeController.update);
router.delete('/:id', validateId, recipeController.remove);
router.put('/:id/favorite', validateId, recipeController.addFavorite);
router.delete('/:id/favorite', validateId, recipeController.removeFavorite);

module.exports = router;