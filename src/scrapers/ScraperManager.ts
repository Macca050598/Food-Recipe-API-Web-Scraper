import { BaseScraper } from './BaseScraper';
import { Recipe } from '../models/Recipe';
import { BBCGoodFoodScraper } from './BBCGoodFoodScraper';
import { logger } from '../utils/logger';

export class ScraperManager {
  private scrapers: Map<string, BaseScraper>;
  private readonly RECIPE_COLLECTIONS = [
    // 'quick-and-easy-family-recipes',
    // 'easy-dinner-recipes',
    // 'cheap-and-healthy-recipes',
    // 'student-recipes',
    // 'meal-prep-recipes',
    // 'one-pot-recipes',
    '30-minute-meals'
  ];

  constructor() {
    this.scrapers = new Map([
      ['bbcgoodfood', new BBCGoodFoodScraper()]
    ]);
  }

  async scrapeAndSave(
    source: string, 
    pagesPerCollection: number = 15,
    startPage: number = 1  // Add startPage parameter
  ): Promise<void> {
    const scraper = this.scrapers.get(source);
    if (!scraper) {
      throw new Error(`No scraper found for source: ${source}`);
    }

    try {
      for (const collection of this.RECIPE_COLLECTIONS) {
        logger.info(`Starting to scrape collection: ${collection}`);
        
        for (let page = startPage; page <= startPage + pagesPerCollection - 1; page++) {
          try {
            logger.info(`Scraping page ${page} of ${collection}`);
            
            // Add retry logic with exponential backoff
            const recipeUrls = await this.retryOperation(
              () => scraper.scrapeRecipeList(page, collection),
              3,  // 3 retries
              5000 // Start with 5 second delay
            );
            
            logger.info(`Found ${recipeUrls.length} recipes on page ${page}`);
            
            // Add longer delay between pages
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            for (const url of recipeUrls) {
              try {
                const recipeData = await scraper.scrapeRecipe(url, collection);
                
                // Try to find existing recipe
                let recipe = await Recipe.findOne({ sourceUrl: recipeData.sourceUrl });
                
                if (recipe) {
                  // If recipe exists, add the collection if not already present
                  if (!recipe.collections.includes(collection)) {
                    recipe.collections.push(collection);
                    await recipe.save();
                    logger.info(`Added collection ${collection} to existing recipe: ${recipe.title}`);
                  }
                } else {
                  // Create new recipe with collection
                  recipe = new Recipe({
                    ...recipeData,
                    collections: [collection]
                  });
                  await recipe.save();
                  logger.info(`Successfully saved recipe: ${recipe.title} (${collection})`);
                }
                
                // Increase delay between recipes
                await new Promise(resolve => setTimeout(resolve, 2000));
              } catch (error) {
                logger.error(`Error processing recipe ${url}:`, error);
                continue;
              }
            }
          } catch (error) {
            logger.error(`Error on page ${page} of ${collection}:`, error);
            // Continue with next page instead of stopping completely
            continue;
          }
        }
      }
    } catch (error) {
      logger.error(`Error in scraping process:`, error);
      throw error;
    } finally {
      await scraper['cleanup']();
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number,
    delay: number
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        logger.info(`Retrying operation after ${delay}ms. Retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryOperation(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }
} 