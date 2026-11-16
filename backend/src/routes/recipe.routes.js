const express = require('express');
const recipeController = require('../controllers/recipe.controller');
const { validateCreateRecipe, validateUpdateRecipe, validateId } = require('../validators/recipe.validator');

const router = express.Router();

router.get('/', recipeController.list);
router.post('/', validateCreateRecipe, recipeController.create);
router.get('/:id', validateId, recipeController.getOne);
router.patch('/:id', validateId, validateUpdateRecipe, recipeController.update);
router.delete('/:id', validateId, recipeController.remove);

module.exports = router;