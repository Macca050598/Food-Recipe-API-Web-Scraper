import { BaseScraper } from './BaseScraper';
import { IRecipe } from '../models/Recipe';
import { logger } from '../utils/logger';
import { Page } from 'puppeteer';

export class BBCGoodFoodScraper extends BaseScraper {
  constructor() {
    super('https://www.bbcgoodfood.com');
  }

  async scrapeRecipeList(pageNum: number, collection: string): Promise<string[]> {
    let page: Page | null = null;
    try {
      const url = `${this.baseUrl}/recipes/collection/${collection}?page=${pageNum}`;
      page = await this.getPage(url);

      logger.info('Accessing URL: ' + url);
      await page.waitForSelector('body', { timeout: 10000 });

      // Get unique URLs only
      const hrefs = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/recipes/"]'));
        const uniqueUrls = new Set(
          links
            .map(link => link.getAttribute('href'))
            .filter(href => {
              if (!href) return false;
              return !href.includes('/collection/') && 
                     !href.includes('/category/') &&
                     href.includes('/recipes/');
            })
        );
        return Array.from(uniqueUrls);
      });

      logger.info(`Found ${hrefs.length} unique recipe URLs`);
      if (hrefs.length > 0) {
        logger.info('Sample URLs:', hrefs.slice(0, 3));
      }

      return hrefs.filter((href): href is string => href !== null);
    } catch (error) {
      logger.error(`Error scraping recipe list page ${pageNum}:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async scrapeRecipe(url: string, collection: string): Promise<Partial<IRecipe>> {
    let page: Page | null = null;
    try {
      const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      page = await this.getPage(fullUrl);

      await page.waitForSelector('main', { timeout: 10000 });

      const recipeData = await page.evaluate(() => {
        // Get basic info
        const title = document.querySelector('h1')?.textContent?.trim() || '';
        const description = document.querySelector('[data-test-id="recipe-description"]')?.textContent?.trim() || 
                          document.querySelector('.recipe__description')?.textContent?.trim() || 
                          'No description available';
        
        // Get ingredients
        const ingredientElements = document.querySelectorAll('.ingredients-list__item, [data-test-id="recipe-ingredients-item"]');
        const ingredients = Array.from(ingredientElements).map(el => {
          const text = el.textContent?.trim() || '';
          const match = text.match(/^([\d.\/]+)?\s*(\w+)?\s*(.+)$/);
          return {
            amount: match?.[1] ? parseFloat(match[1]) : 1,
            unit: match?.[2] || 'piece',
            item: match?.[3] || text
          };
        });

        // Get all content first
        const allElements = document.querySelectorAll(
          // '.recipe__method-steps .recipe__method-step, ' +    // New format
          // '.method__list .method__item, ' +                   // Alternative format
          // '[data-test-id="recipe-method-step"], ' +          // Test ID format
          '.method-steps__list'                          // Another possible format
        );

          // Get all content first
          const nutritionElements = document.querySelectorAll(
            // '.recipe__method-steps .recipe__method-step, ' +    // New format
            // '.method__list .method__item, ' +                   // Alternative format
            // '[data-test-id="recipe-method-step"], ' +          // Test ID format
            '.nutrition-list'                          // Another possible format
          );


        // Separate instructions from other content
        const instructions = Array.from(allElements)
          .map(el => el.textContent?.trim() || '')
          .filter(text => {
            if (!text.length) return false;
            
            // Skip if it looks like an ingredient (starts with number or measurement)
            if (text.match(/^\d+(\.\d+)?\s*(g|ml|tbsp|tsp|cup|oz|piece|bunch)/i)) return false;
            
            // Skip if it looks like nutritional info
            if (text.match(/^(kcal|protein|carbs|fat|sugar|fibre|salt, saturates)/i)) return false;
            
            // Skip advertisements
            if (text.toLowerCase().includes('advertisement')) return false;
            
            // Skip if it's just a number (like step numbers)
            if (text.match(/^\d+$/)) return false;

            return true;
          })
          .map(text => text.replace(/^step\s*\d+[\s:]*/i, '').trim()); // Remove step prefixes

        // Updated image selector
        const mainImage = document.querySelector('.recipe__gallery-item img, .post-header__image-container img');
        const recipeImage = document.querySelector('.image__img[data-recipe-image], img[data-recipe-main-image]');
        const defaultImage = document.querySelector('.image__img[data-item-name]');
        
        const imageUrl = mainImage?.getAttribute('src') || 
                        recipeImage?.getAttribute('src') || 
                        defaultImage?.getAttribute('src') ||
                        'https://www.bbcgoodfood.com/images/default-recipe.jpg';

        // Get cooking info and difficulty
        const cookingInfo = {
          prep: 30,
          cook: 30,
          difficulty: 'medium' as 'easy' | 'medium' | 'hard'
        };

        const cookingTimeList = document.querySelector('.recipe__cook-and-prep');
        if (cookingTimeList) {
          const timeText = cookingTimeList.textContent?.toLowerCase() || '';
          
          const prepMatch = timeText.match(/prep:?\s*(\d+)/);
          if (prepMatch) cookingInfo.prep = parseInt(prepMatch[1]);
          
          const cookMatch = timeText.match(/cook:?\s*(\d+)/);
          if (cookMatch) cookingInfo.cook = parseInt(cookMatch[1]);
          
          // Get difficulty
          if (timeText.includes('easy')) cookingInfo.difficulty = 'easy';
          if (timeText.includes('more effort')) cookingInfo.difficulty = 'medium';
          if (timeText.includes('challenge')) cookingInfo.difficulty = 'hard';
        }

        // Get nutritional info separately
        const nutritionalInfo = {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          saturates: 0
        };

        // Look for nutrition values in the content
        const nutritionList = document.querySelector('.nutrition-list');
        if (nutritionList) {
          const nutritionText = nutritionList.textContent?.toLowerCase() || '';
          
          // Log the full nutrition text for debugging
          console.log('Nutrition text:', nutritionText);
          
          // Updated regex patterns to match BBC's format
          const kcalMatch = nutritionText.match(/kcal\s*(\d+)/);  // Changed to match "kcal 354" format
          const proteinMatch = nutritionText.match(/protein\s*(\d+)/);
          const carbsMatch = nutritionText.match(/carbs?\s*(\d+)/);
          const fatMatch = nutritionText.match(/fat\s*(\d+)/);
          const saturatesMatch = nutritionText.match(/saturates\s*(\d+)/);

          if (kcalMatch) nutritionalInfo.calories = parseInt(kcalMatch[1]);
          if (proteinMatch) nutritionalInfo.protein = parseInt(proteinMatch[1]);
          if (carbsMatch) nutritionalInfo.carbohydrates = parseInt(carbsMatch[1]);
          if (fatMatch) nutritionalInfo.fat = parseInt(fatMatch[1]);
          if (saturatesMatch) nutritionalInfo.saturates = parseInt(saturatesMatch[1]);
        }

        // Get dietary info
        const dietaryInfo = {
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          eggFree: false,
          dairyFree: false,
          pescetarian: false,
          lowCalorie: false,
          healthy: false,
          lowFat: false,
          lowCarb: false,
          nutFree: false
        };

        const dietaryTerms = document.querySelector('.terms-icons-list');
        if (dietaryTerms) {
          const termsText = dietaryTerms.textContent?.toLowerCase() || '';
          
          // Check for all possible dietary indicators
          dietaryInfo.vegetarian = termsText.includes('vegetarian');
          dietaryInfo.vegan = termsText.includes('vegan');
          dietaryInfo.glutenFree = termsText.includes('gluten-free') || termsText.includes('gluten free');
          dietaryInfo.eggFree = termsText.includes('egg-free') || termsText.includes('egg free');
          dietaryInfo.dairyFree = termsText.includes('dairy-free') || termsText.includes('dairy free');
          dietaryInfo.pescetarian = termsText.includes('pescatarian') || termsText.includes('fish');
          dietaryInfo.lowCalorie = termsText.includes('low calorie');
          dietaryInfo.healthy = termsText.includes('healthy');
          dietaryInfo.lowFat = termsText.includes('low fat');
          dietaryInfo.lowCarb = termsText.includes('low carb');
          dietaryInfo.nutFree = termsText.includes('nut free');
        }

        return {
          title,
          description,
          ingredients,
          instructions,
          imageUrl,
          preparationTime: cookingInfo.prep,
          cookingTime: cookingInfo.cook,
          difficulty: cookingInfo.difficulty,
          dietaryInfo,
          nutritionalInfo
        };
      });

      return {
        ...recipeData,
        servings: 4,
        cuisine: 'Unknown',
        sourceUrl: fullUrl,
        dateAdded: new Date()
      };
    } catch (error) {
      logger.error(`Error scraping recipe from ${url}:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
} 