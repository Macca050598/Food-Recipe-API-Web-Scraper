import { connectDatabase } from '../config/database';
import { Recipe, IRecipe } from '../models/Recipe';

async function displayRecipe() {
  try {
    await connectDatabase();
    
    // // Instead of random recipe, get specific recipe
    // const recipe = await Recipe.findOne({ 
    //   title: "Prawn & coconut soup"  // Exact title match
    // });
    
    // Or if we need case-insensitive partial match:
    const recipe = await Recipe.findOne({ 
      title: { $regex: '', $options: 'i' }
    });
    
    if (!recipe) {
      console.log('No recipes found in database');
      process.exit(0);
    }

    console.log('\n=== Recipe Details ===');
    console.log(`Title: ${recipe.title}`);
    console.log(`Description: ${recipe.description}`);
    
    console.log('\nIngredients:');
    recipe.ingredients.forEach((ing: { amount: number; unit: string; item: string }) => 
      console.log(`- ${ing.amount} ${ing.unit} ${ing.item}`)
    );
    
    console.log('\nInstructions:');
    recipe.instructions.forEach((step: string, i: number) => 
      console.log(`${i + 1}. ${step}`)
    );
    
    console.log('\nCooking Info:');
    console.log(`Prep Time: ${recipe.preparationTime} minutes`);
    console.log(`Cook Time: ${recipe.cookingTime} minutes`);
    console.log(`Servings: ${recipe.servings}`);
    console.log(`Difficulty: ${recipe.difficulty}`);
    console.log(`Cuisine: ${recipe.cuisine}`);
    
    console.log('\nDietary Info:');
    Object.entries(recipe.dietaryInfo).forEach(([key, value]) => 
      console.log(`- ${key}: ${value}`)
    );
    
    console.log('\nNutritional Info:');
    Object.entries(recipe.nutritionalInfo).forEach(([key, value]) => 
      console.log(`- ${key}: ${value}`)
    );
    
    console.log('\nCollections:');
    recipe.collections.forEach(collection => 
      console.log(`- ${collection.replace(/-/g, ' ')}`)
    );
    
    console.log('\nSource URL:', recipe.sourceUrl);
    console.log('Image URL:', recipe.imageUrl);
    console.log('========================\n');

    // List all recipes in the database
    const recipes = await Recipe.find({}, 'title sourceUrl');
    console.log('\nAll recipes in database:');
    recipes.forEach(r => {
      console.log(`- ${r.title} (${r.sourceUrl})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

displayRecipe(); 