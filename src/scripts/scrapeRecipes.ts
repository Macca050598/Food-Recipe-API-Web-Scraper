import { ScraperManager } from '../scrapers/ScraperManager';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

async function main() {
  try {
    await connectDatabase();
    const scraperManager = new ScraperManager();
    
    logger.info('Starting scrape process...');
    // Change from 1 to 15 pages
    await scraperManager.scrapeAndSave('bbcgoodfood', 4); 
    
    // Add a count of saved recipes
    const Recipe = (await import('../models/Recipe')).Recipe;
    const count = await Recipe.countDocuments();
    logger.info(`Total recipes in database: ${count}`);
    
    logger.info('Scraping completed successfully');
    process.exit(0);  // Add explicit exit
  } catch (error) {
    logger.error('Scraping failed:', error);
    process.exit(1);
  }
}

main(); 