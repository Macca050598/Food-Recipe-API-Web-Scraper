"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recipe = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RecipeSchema = new mongoose_1.Schema({
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
    cuisine: { type: String, required: true, index: true },
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
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }
        }]
}, {
    timestamps: true
});
// Add indexes for common queries
RecipeSchema.index({ title: 'text', description: 'text' });
RecipeSchema.index({ 'dietaryInfo.vegetarian': 1 });
RecipeSchema.index({ 'dietaryInfo.vegan': 1 });
RecipeSchema.index({ preparationTime: 1 });
RecipeSchema.index({ cuisine: 1 });
exports.Recipe = mongoose_1.default.model('Recipe', RecipeSchema);
