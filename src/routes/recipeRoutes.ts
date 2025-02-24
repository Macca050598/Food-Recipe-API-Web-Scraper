import { Router } from 'express';
import { RecipeController } from '../controllers/recipeController';

const router = Router();

router.get('/', RecipeController.getAllRecipes);
router.get('/search', RecipeController.searchRecipes);
router.get('/:id', RecipeController.getRecipeById);
router.post('/', RecipeController.createRecipe);

export default router; 