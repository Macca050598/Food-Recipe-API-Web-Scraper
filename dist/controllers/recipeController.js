"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeController = void 0;
const Recipe_1 = require("../models/Recipe");
const logger_1 = require("../utils/logger");
class RecipeController {
    // Get all recipes with pagination
    static async getAllRecipes(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const recipes = await Recipe_1.Recipe.find()
                .skip(skip)
                .limit(limit)
                .sort({ dateAdded: -1 });
            const total = await Recipe_1.Recipe.countDocuments();
            res.json({
                data: recipes,
                page,
                totalPages: Math.ceil(total / limit),
                total
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching recipes:', error);
            res.status(500).json({ error: 'Failed to fetch recipes' });
        }
    }
    // Get recipe by ID
    static async getRecipeById(req, res) {
        try {
            const recipe = await Recipe_1.Recipe.findById(req.params.id);
            if (!recipe) {
                res.status(404).json({ error: 'Recipe not found' });
                return;
            }
            res.json(recipe);
        }
        catch (error) {
            logger_1.logger.error('Error fetching recipe:', error);
            res.status(500).json({ error: 'Failed to fetch recipe' });
        }
    }
    // Create new recipe
    static async createRecipe(req, res) {
        try {
            const recipe = new Recipe_1.Recipe(req.body);
            await recipe.save();
            logger_1.logger.info(`New recipe created: ${recipe.title}`);
            res.status(201).json(recipe);
        }
        catch (error) {
            logger_1.logger.error('Error creating recipe:', error);
            res.status(400).json({ error: 'Failed to create recipe' });
        }
    }
    // Search recipes
    static async searchRecipes(req, res) {
        try {
            const { title, cuisine, difficulty, maxPrepTime, vegetarian, vegan } = req.query;
            const query = {};
            if (title) {
                query.title = { $regex: title, $options: 'i' };
            }
            if (cuisine) {
                query.cuisine = { $regex: cuisine, $options: 'i' };
            }
            if (difficulty) {
                query.difficulty = difficulty;
            }
            if (maxPrepTime) {
                query.preparationTime = { $lte: parseInt(maxPrepTime) };
            }
            if (vegetarian === 'true') {
                query['dietaryInfo.vegetarian'] = true;
            }
            if (vegan === 'true') {
                query['dietaryInfo.vegan'] = true;
            }
            const recipes = await Recipe_1.Recipe.find(query).limit(20);
            res.json(recipes);
        }
        catch (error) {
            logger_1.logger.error('Error searching recipes:', error);
            res.status(500).json({ error: 'Failed to search recipes' });
        }
    }
}
exports.RecipeController = RecipeController;
