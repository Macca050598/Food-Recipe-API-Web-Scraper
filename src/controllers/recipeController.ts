import { Request, Response } from 'express';
import { Recipe } from '../models/Recipe';
import { logger } from '../utils/logger';

export class RecipeController {
  // Get all recipes with pagination
  public static async getAllRecipes(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const recipes = await Recipe.find()
        .skip(skip)
        .limit(limit)
        .sort({ dateAdded: -1 });

      const total = await Recipe.countDocuments();

      res.json({
        data: recipes,
        page,
        totalPages: Math.ceil(total / limit),
        total
      });
    } catch (error) {
      logger.error('Error fetching recipes:', error);
      res.status(500).json({ error: 'Failed to fetch recipes' });
    }
  }

  // Get recipe by ID
  public static async getRecipeById(req: Request, res: Response): Promise<void> {
    try {
      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      res.json(recipe);
    } catch (error) {
      logger.error('Error fetching recipe:', error);
      res.status(500).json({ error: 'Failed to fetch recipe' });
    }
  }

  // Create new recipe
  public static async createRecipe(req: Request, res: Response): Promise<void> {
    try {
      const recipe = new Recipe(req.body);
      await recipe.save();
      logger.info(`New recipe created: ${recipe.title}`);
      res.status(201).json(recipe);
    } catch (error) {
      logger.error('Error creating recipe:', error);
      res.status(400).json({ error: 'Failed to create recipe' });
    }
  }

  // Search recipes
  public static async searchRecipes(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        cuisine,
        difficulty,
        maxPrepTime,
        vegetarian,
        vegan,
        pescetarian
      } = req.query;

      const query: any = {};

      if (title) {
        query.title = { $regex: title as string, $options: 'i' };
      }
      if (cuisine) {
        query.cuisine = { $regex: cuisine as string, $options: 'i' };
      }
      if (difficulty) {
        query.difficulty = difficulty;
      }
      if (maxPrepTime) {
        query.preparationTime = { $lte: parseInt(maxPrepTime as string) };
      }
      if (vegetarian === 'true') {
        query['dietaryInfo.vegetarian'] = true;
      }
      if (vegan === 'true') {
        query['dietaryInfo.vegan'] = true;
      }
      if (pescetarian === 'true') {
        query['dietaryInfo.pescetarian'] = true;
      }

      const recipes = await Recipe.find(query).limit(20);
      res.json(recipes);
    } catch (error) {
      logger.error('Error searching recipes:', error);
      res.status(500).json({ error: 'Failed to search recipes' });
    }
  }
} 