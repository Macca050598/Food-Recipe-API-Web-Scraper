import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import recipeRoutes from './routes/recipeRoutes';
import rateLimit from 'express-rate-limit';
import apicache from 'apicache';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increase to 1000 requests per window
  message: 'Too many requests from this IP, please try again later'
});

// Cache successful GET requests for 5 minutes
const cache = apicache.middleware('5 minutes');

// Apply middleware to routes
app.use('/api/recipes', limiter);
app.use('/api/recipes', cache);
app.use('/api/recipes', recipeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }); 