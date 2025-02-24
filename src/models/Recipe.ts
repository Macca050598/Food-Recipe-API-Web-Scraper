import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
  title: string;
  description: string;
  ingredients: Array<{
    item: string;
    amount: number;
    unit: string;
  }>;
  instructions: string[];
  preparationTime: number;
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  dietaryInfo: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    eggFree: boolean;
    dairyFree: boolean;
    pescetarian: boolean;
    lowCalorie: boolean;
    healthy: boolean;
    lowFat: boolean;
    lowCarb: boolean;
    nutFree: boolean;
  };
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  imageUrl: string;
  sourceUrl: string;
  dateAdded: Date;
  ratings: Array<{
    score: number;
    review: string;
    userId: string;
  }>;
  collections: string[];
}

const RecipeSchema = new Schema<IRecipe>({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  ingredients: [{
    item: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  instructions: [{ type: String, required: true }],
  preparationTime: { type: Number, required: true },
  cookingTime: { type: Number, required: true },
  servings: { type: Number, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  cuisine: { 
    type: String, 
    required: false,
    default: 'Unknown',
    index: true 
  },
  dietaryInfo: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    eggFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    pescetarian: { type: Boolean, default: false },
    lowCalorie: { type: Boolean, default: false },
    healthy: { type: Boolean, default: false },
    lowFat: { type: Boolean, default: false },
    lowCarb: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false }
  },
  nutritionalInfo: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fat: { type: Number, required: true }
  },
  imageUrl: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now, index: true },
  ratings: [{
    score: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  collections: [{ type: String }]
}, {
  timestamps: true
});

// Add indexes for common queries
RecipeSchema.index({ title: 'text', description: 'text' });
RecipeSchema.index({ 'dietaryInfo.vegetarian': 1 });
RecipeSchema.index({ 'dietaryInfo.vegan': 1 });
RecipeSchema.index({ preparationTime: 1 });
RecipeSchema.index({ cuisine: 1 });
RecipeSchema.index({ 'dietaryInfo.pescetarian': 1 });

export const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema); 