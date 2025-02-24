import { connectDatabase } from '../config/database';
import { Recipe } from '../models/Recipe';
import { logger } from '../utils/logger';

async function clearDb() {
  try {
    await connectDatabase();
    await Recipe.deleteMany({});
    logger.info('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDb(); 