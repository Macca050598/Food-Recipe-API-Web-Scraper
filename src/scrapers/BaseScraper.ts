import puppeteer, { Browser, Page } from 'puppeteer';
import { IRecipe } from '../models/Recipe';
import { logger } from '../utils/logger';

export abstract class BaseScraper {
  protected baseUrl: string;
  protected delay: number = 1000; // Delay between requests in ms
  protected browser: Browser | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.platform === 'darwin' 
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'  // macOS path
          : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'   // Windows path
          : '/usr/bin/google-chrome'  // Linux path
      });
    }
  }

  protected async getPage(url: string): Promise<Page> {
    await this.initBrowser();
    const page = await this.browser!.newPage();
    
    // Add more realistic browser behavior
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    // Add random delay between 2-5 seconds
    await this.sleep(Math.random() * 3000 + 2000);
    
    try {
      // Use domcontentloaded instead of networkidle0 for faster response
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000  // Increase timeout to 45 seconds
      });

      // Additional random delay after page load
      await this.sleep(Math.random() * 2000 + 1000);
      
      return page;
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await this.sleep(delay);
        return this.retryOperation(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  abstract scrapeRecipe(url: string, collection: string): Promise<Partial<IRecipe>>;
  abstract scrapeRecipeList(page: number, collection: string): Promise<string[]>;
} 
