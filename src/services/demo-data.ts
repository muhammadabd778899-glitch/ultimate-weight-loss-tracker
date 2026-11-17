/**
 * Ultimate Weight Loss & Fitness Tracker
 * Demo data generator — realistic, internally consistent fictional data.
 *
 * Base date: 60 days ago. All records reference consistent dates and values.
 * Nothing is medically prescriptive; values are plausible ranges only.
 */

import type {
  WeightEntry, BodyMeasurement, FoodItem, MealEntry, Recipe, RecipeIngredient,
  MealPlan, GroceryItem, WorkoutSession, ExerciseLibraryItem, WorkoutExercise,
  WorkoutPlan, Habit, HabitEntry, SleepEntry, WaterEntry, Goal, Milestone,
  Challenge, ChallengeEntry, JournalEntry, Achievement,
} from '../types';
import { newId, today } from '../types';

const BASE_DAY = 60; // days of history
const nowStr = today();

function offsetDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const rngSeed = 42;
let _seed = rngSeed;
function rrand(min: number, max: number): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return min + (_seed / 0x7fffffff) * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rrand(0, arr.length))];
}

// ---------------------------------------------------------------
// Profile & settings for demo
// ---------------------------------------------------------------
export const DEMO_PROFILE = {
  displayName: 'Alex Morgan',
  heightCm: 172,
  heightIn: undefined,
  preferredWeightUnit: 'kg' as const,
  preferredMeasurementUnit: 'cm' as const,
  dateFormat: 'YYYY-MM-DD' as const,
  weekStart: 1,
  currency: 'USD',
  dailyWaterTargetMl: 2200,
  demoMode: true,
  onboardingCompleted: true,
} as const;

export const DEMO_SETTINGS = {
  preferredDashboardMetrics: ['weight', 'calories', 'water', 'workouts', 'habits'],
  customFoodCategories: [],
  customWorkoutCategories: [],
  customHabits: [],
  notificationsEnabled: true,
  reducedMotion: false,
} as const;

// ---------------------------------------------------------------
// Weight entries — 60 days, gentle downward trend with noise
// ---------------------------------------------------------------
export function generateWeightEntries(): WeightEntry[] {
  const entries: WeightEntry[] = [];
  let weight = 84.2; // starting kg
  for (let i = BASE_DAY; i >= 0; i--) {
    const date = offsetDate(i);
    // overall trend down ~6 kg over 60 days, plus daily noise
    const trend = 84.2 - (BASE_DAY - i) * 0.10;
    const noise = rrand(-0.4, 0.4);
    weight = Math.max(68, trend + noise);
    entries.push({
      id: newId(),
      date,
      weight: Math.round(weight * 10) / 10,
      unit: 'kg',
      notes: i % 7 === 0 ? 'Weekly check-in' : undefined,
      createdAt: new Date(date).toISOString(),
      updatedAt: new Date(date).toISOString(),
    });
  }
  return entries;
}

// ---------------------------------------------------------------
// Body measurements — 20 records across dates
// ---------------------------------------------------------------
const MEASURE_TYPES: BodyMeasurement['type'][] = [
  'waist','hips','chest','neck','shoulders','leftArm','rightArm','leftThigh','rightThigh','leftCalf','rightCalf',
];

export function generateBodyMeasurements(): BodyMeasurement[] {
  const entries: BodyMeasurement[] = [];
  const base: Record<string, number> = {
    waist: 94, hips: 106, chest: 104, neck: 39, shoulders: 50,
    leftArm: 34, rightArm: 34, leftThigh: 58, rightThigh: 58, leftCalf: 38, rightCalf: 38,
  };
  let count = 0;
  for (let i = BASE_DAY; i >= 0 && count < 20; i -= 3) {
    const type = pick(MEASURE_TYPES);
    const date = offsetDate(i);
    const change = (BASE_DAY - i) * 0.05;
    entries.push({
      id: newId(),
      date,
      type,
      value: Math.round((base[type] - change + rrand(-0.5, 0.5)) * 10) / 10,
      unit: 'cm',
      notes: count % 5 === 0 ? 'Measured after workout' : undefined,
      createdAt: new Date(date).toISOString(),
      updatedAt: new Date(date).toISOString(),
    });
    count++;
  }
  return entries;
}

// ---------------------------------------------------------------
// Food items — 30 items
// ---------------------------------------------------------------
const FOODS: Array<Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Rolled Oats', category: 'Grains', brand: 'Generic', servingSize: 40, servingUnit: 'g', calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4, sugar: 1, sodium: 2, isCustom: true, isFavorite: true },
  { name: 'Chicken Breast', category: 'Protein', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, isCustom: true, isFavorite: true },
  { name: 'Brown Rice', category: 'Grains', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 130, protein: 3, carbs: 28, fat: 0.3, fiber: 2, sugar: 0, sodium: 5, isCustom: true, isFavorite: true },
  { name: 'Avocado', category: 'Fruits', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7, sodium: 7, isCustom: true, isFavorite: true },
  { name: 'Banana', category: 'Fruits', brand: 'Generic', servingSize: 118, servingUnit: 'g', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1, sugar: 14, sodium: 1, isCustom: true, isFavorite: true },
  { name: 'Eggs', category: 'Protein', brand: 'Generic', servingSize: 50, servingUnit: 'g', calories: 72, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.6, sodium: 71, isCustom: true, isFavorite: true },
  { name: 'Salmon', category: 'Protein', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 61, isCustom: true, isFavorite: true },
  { name: 'Greek Yogurt', category: 'Dairy', brand: 'Generic', servingSize: 150, servingUnit: 'g', calories: 130, protein: 11, carbs: 8, fat: 0, fiber: 0, sugar: 7, sodium: 60, isCustom: true, isFavorite: true },
  { name: 'Almonds', category: 'Nuts & Seeds', brand: 'Generic', servingSize: 28, servingUnit: 'g', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, sugar: 1, sodium: 0, isCustom: true, isFavorite: true },
  { name: 'Broccoli', category: 'Vegetables', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, isCustom: true, isFavorite: true },
  { name: 'Quinoa', category: 'Grains', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 120, protein: 4, carbs: 22, fat: 2, fiber: 2.5, sugar: 0.8, sodium: 7, isCustom: true, isFavorite: false },
  { name: 'Apple', category: 'Fruits', brand: 'Generic', servingSize: 182, servingUnit: 'g', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2, isCustom: true, isFavorite: false },
  { name: 'Spinach', category: 'Vegetables', brand: 'Generic', servingSize: 30, servingUnit: 'g', calories: 7, protein: 0.7, carbs: 1, fat: 0.1, fiber: 0.7, sugar: 0.1, sodium: 24, isCustom: true, isFavorite: false },
  { name: 'Peanut Butter', category: 'Nuts & Seeds', brand: 'Generic', servingSize: 32, servingUnit: 'g', calories: 190, protein: 7, carbs: 7, fat: 16, fiber: 2, sugar: 3, sodium: 140, isCustom: true, isFavorite: false },
  { name: 'Whole Grain Bread', category: 'Grains', brand: 'Generic', servingSize: 45, servingUnit: 'g', calories: 110, protein: 5, carbs: 20, fat: 1.5, fiber: 3, sugar: 3, sodium: 140, isCustom: true, isFavorite: false },
  { name: 'Cottage Cheese', category: 'Dairy', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7, sodium: 364, isCustom: true, isFavorite: false },
  { name: 'Sweet Potato', category: 'Vegetables', brand: 'Generic', servingSize: 130, servingUnit: 'g', calories: 112, protein: 2, carbs: 26, fat: 0.1, fiber: 4, sugar: 6, sodium: 41, isCustom: true, isFavorite: false },
  { name: 'Tofu', category: 'Protein', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 76, protein: 8, carbs: 2, fat: 4.8, fiber: 0.3, sugar: 0.3, sodium: 7, isCustom: true, isFavorite: false },
  { name: 'Olive Oil', category: 'Fats & Oils', brand: 'Generic', servingSize: 15, servingUnit: 'ml', calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 0, isCustom: true, isFavorite: false },
  { name: 'Blueberries', category: 'Fruits', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sugar: 10, sodium: 1, isCustom: true, isFavorite: false },
  { name: 'Chickpeas', category: 'Legumes', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 7.6, sugar: 5, sodium: 1, isCustom: true, isFavorite: false },
  { name: 'Milk', category: 'Dairy', brand: 'Generic', servingSize: 250, servingUnit: 'ml', calories: 122, protein: 8, carbs: 12, fat: 4.8, fiber: 0, sugar: 12, sodium: 105, isCustom: true, isFavorite: false },
  { name: 'Whole Wheat Pasta', category: 'Grains', brand: 'Generic', servingSize: 80, servingUnit: 'g', calories: 290, protein: 11, carbs: 58, fat: 1.5, fiber: 7, sugar: 2, sodium: 2, isCustom: true, isFavorite: false },
  { name: 'Turkey Breast', category: 'Protein', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 135, protein: 30, carbs: 0, fat: 0.7, fiber: 0, sugar: 0, sodium: 55, isCustom: true, isFavorite: false },
  { name: 'Dark Chocolate', category: 'Snacks', brand: 'Generic', servingSize: 30, servingUnit: 'g', calories: 170, protein: 2, carbs: 13, fat: 12, fiber: 3, sugar: 8, sodium: 5, isCustom: true, isFavorite: false },
  { name: 'Carrots', category: 'Vegetables', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69, isCustom: true, isFavorite: false },
  { name: 'Cucumber', category: 'Vegetables', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 15, protein: 0.7, carbs: 4, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2, isCustom: true, isFavorite: false },
  { name: 'Protein Powder', category: 'Supplements', brand: 'Generic', servingSize: 30, servingUnit: 'g', calories: 110, protein: 24, carbs: 2, fat: 1, fiber: 1, sugar: 1, sodium: 45, isCustom: true, isFavorite: false },
  { name: 'Black Beans', category: 'Legumes', brand: 'Generic', servingSize: 100, servingUnit: 'g', calories: 132, protein: 9, carbs: 24, fat: 0.5, fiber: 8.7, sugar: 0, sodium: 1, isCustom: true, isFavorite: false },
  { name: 'Green Tea', category: 'Beverages', brand: 'Generic', servingSize: 250, servingUnit: 'ml', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 1, isCustom: true, isFavorite: false },
];

export function generateFoodItems(): FoodItem[] {
  return FOODS.map((f) => ({
    ...f,
    id: newId(),
    isCustom: true,
    notes: 'Nutrition values are estimates and may vary by brand and preparation. Logged values are not a substitute for professional dietary advice.',
    disclaimerNote: 'Manually entered nutrition information may be incomplete or inaccurate.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------
// Recipes — 15 recipes with ingredients
// ---------------------------------------------------------------
export function generateRecipes(foods: FoodItem[]): Recipe[] {
  const find = (name: string) => foods.find((f) => f.name === name);
  const ing = (name: string, qty: number, unit: string): RecipeIngredient => {
    const f = find(name);
    const mult = qty / (f?.servingSize || 1);
    return {
      id: newId(),
      foodId: f?.id,
      foodName: name,
      quantity: qty,
      unit,
      calories: Math.round((f?.calories || 0) * mult * 10) / 10,
      protein: Math.round((f?.protein || 0) * mult * 10) / 10,
      carbs: Math.round((f?.carbs || 0) * mult * 10) / 10,
      fat: Math.round((f?.fat || 0) * mult * 10) / 10,
      fiber: Math.round((f?.fiber || 0) * mult * 10) / 10,
      sugar: Math.round((f?.sugar || 0) * mult * 10) / 10,
      sodium: Math.round((f?.sodium || 0) * mult * 10) / 10,
    };
  };

  const recipes: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'nutritionPerServing'>[] = [
    {
      name: 'Berry Oat Breakfast Bowl',
      description: 'Warm oats topped with banana, blueberries, and almonds.',
      category: 'breakfast',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 5,
      instructions: 'Cook oats with water or milk. Top with sliced banana, blueberries, and almonds. Drizzle with peanut butter if desired.',
      isFavorite: true,
      ingredients: [ing('Rolled Oats', 40, 'g'), ing('Banana', 1, 'piece'), ing('Blueberries', 50, 'g'), ing('Almonds', 10, 'g')],
    },
    {
      name: 'Grilled Chicken Salad',
      description: 'Fresh greens with grilled chicken, cucumber, and avocado.',
      category: 'lunch',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 12,
      instructions: 'Grill chicken breast until cooked through. Slice and serve over spinach, cucumber, carrots, and avocado.',
      isFavorite: true,
      ingredients: [ing('Chicken Breast', 120, 'g'), ing('Spinach', 40, 'g'), ing('Cucumber', 60, 'g'), ing('Carrots', 40, 'g'), ing('Avocado', 40, 'g')],
    },
    {
      name: 'Salmon with Quinoa and Broccoli',
      description: 'Baked salmon with quinoa and steamed broccoli.',
      category: 'dinner',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 20,
      instructions: 'Bake salmon at 200°C for 12–15 minutes. Cook quinoa and steam broccoli. Serve together with lemon.',
      isFavorite: true,
      ingredients: [ing('Salmon', 120, 'g'), ing('Quinoa', 60, 'g'), ing('Broccoli', 80, 'g'), ing('Olive Oil', 5, 'ml')],
    },
    {
      name: 'Vegetable Omelette',
      description: 'Three-egg omelette with spinach and mushrooms.',
      category: 'breakfast',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 8,
      instructions: 'Whisk eggs, pour into pan, add spinach and diced vegetables. Fold and serve.',
      isFavorite: false,
      ingredients: [ing('Eggs', 2, 'pieces'), ing('Spinach', 30, 'g'), ing('Olive Oil', 5, 'ml')],
    },
    {
      name: 'Turkey and Avocado Wrap',
      description: 'Whole grain wrap with turkey, avocado, and greens.',
      category: 'lunch',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 0,
      instructions: 'Layer turkey, avocado, spinach, and cucumber on a tortilla. Roll and slice.',
      isFavorite: false,
      ingredients: [ing('Turkey Breast', 90, 'g'), ing('Avocado', 50, 'g'), ing('Whole Grain Bread', 45, 'g'), ing('Spinach', 30, 'g')],
    },
    {
      name: 'Tofu Stir-Fry with Brown Rice',
      description: 'Tofu and vegetables stir-fried with brown rice.',
      category: 'dinner',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 15,
      instructions: 'Stir-fry cubed tofu with broccoli, carrots, and cabbage. Serve over brown rice.',
      isFavorite: false,
      ingredients: [ing('Tofu', 120, 'g'), ing('Brown Rice', 80, 'g'), ing('Broccoli', 60, 'g'), ing('Olive Oil', 5, 'ml')],
    },
    {
      name: 'Greek Yogurt Parfait',
      description: 'Greek yogurt with berries and almonds.',
      category: 'snack',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 0,
      instructions: 'Layer yogurt with blueberries and sprinkle with almonds.',
      isFavorite: false,
      ingredients: [ing('Greek Yogurt', 150, 'g'), ing('Blueberries', 60, 'g'), ing('Almonds', 12, 'g')],
    },
    {
      name: 'Chicken and Sweet Potato Bowl',
      description: 'Roasted chicken with sweet potato and greens.',
      category: 'dinner',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 25,
      instructions: 'Roast chicken and sweet potato cubes. Serve with spinach and a drizzle of olive oil.',
      isFavorite: false,
      ingredients: [ing('Chicken Breast', 120, 'g'), ing('Sweet Potato', 100, 'g'), ing('Spinach', 40, 'g'), ing('Olive Oil', 5, 'ml')],
    },
    {
      name: 'Chickpea Curry',
      description: 'Vegetarian chickpea curry with quinoa.',
      category: 'dinner',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 20,
      instructions: 'Simmer chickpeas with tomatoes and spices. Serve over cooked quinoa.',
      isFavorite: false,
      ingredients: [ing('Chickpeas', 100, 'g'), ing('Quinoa', 50, 'g'), ing('Olive Oil', 5, 'ml')],
    },
    {
      name: 'Protein Banana Smoothie',
      description: 'Quick post-workout smoothie.',
      category: 'snack',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 0,
      instructions: 'Blend banana, milk, protein powder, and blueberries until smooth.',
      isFavorite: false,
      ingredients: [ing('Banana', 1, 'piece'), ing('Milk', 250, 'ml'), ing('Protein Powder', 30, 'g'), ing('Blueberries', 40, 'g')],
    },
    {
      name: 'Cottage Cheese with Pineapple',
      description: 'High-protein cottage cheese snack.',
      category: 'snack',
      servings: 1,
      prepTimeMin: 3,
      cookTimeMin: 0,
      instructions: 'Serve cottage cheese with fresh fruit.',
      isFavorite: false,
      ingredients: [ing('Cottage Cheese', 100, 'g')],
    },
    {
      name: 'Peanut Butter Toast',
      description: 'Whole grain toast with peanut butter and banana.',
      category: 'breakfast',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 2,
      instructions: 'Toast bread, spread peanut butter, top with banana slices.',
      isFavorite: false,
      ingredients: [ing('Whole Grain Bread', 2, 'pieces'), ing('Peanut Butter', 16, 'g'), ing('Banana', 0.5, 'piece')],
    },
    {
      name: 'Apple with Almonds',
      description: 'Simple fruit and nut snack.',
      category: 'snack',
      servings: 1,
      prepTimeMin: 2,
      cookTimeMin: 0,
      instructions: 'Slice apple and serve with almonds.',
      isFavorite: false,
      ingredients: [ing('Apple', 1, 'piece'), ing('Almonds', 14, 'g')],
    },
    {
      name: 'Green Tea',
      description: 'Unsweetened green tea.',
      category: 'beverage',
      servings: 1,
      prepTimeMin: 3,
      cookTimeMin: 3,
      instructions: 'Steep green tea bag in hot water for 2–3 minutes.',
      isFavorite: false,
      ingredients: [ing('Green Tea', 250, 'ml')],
    },
    {
      name: 'Spinach and Tofu Scramble',
      description: 'Tofu scramble with spinach and turmeric.',
      category: 'breakfast',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 10,
      instructions: 'Crumble tofu into pan, add spinach, cook until wilted.',
      isFavorite: false,
      ingredients: [ing('Tofu', 120, 'g'), ing('Spinach', 40, 'g'), ing('Olive Oil', 5, 'ml')]
    }
  ]

  return recipes.map((r) => {
    const totals = r.ingredients.reduce(
      (acc, i) => ({
        calories: acc.calories + i.calories,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat,
        fiber: acc.fiber + i.fiber,
        sugar: acc.sugar + i.sugar,
        sodium: acc.sodium + i.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    );
    const perServing = Object.fromEntries(
      Object.entries(totals).map(([k]) => [k, Math.round(((totals as any)[k] / r.servings) * 10) / 10])
    ) as Recipe['nutritionPerServing'];
    return {
      ...r,
      id: newId(),
      notes: 'Recipe nutrition is calculated from entered ingredient values and is an estimate only.',
      nutritionPerServing: perServing as any,
      imageDataUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// ---------------------------------------------------------------
// Meal entries — 60 days across breakfast/lunch/dinner/snack
// ---------------------------------------------------------------
const MEAL_CATEGORIES: MealEntry['mealCategory'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function generateMealEntries(foods: FoodItem[], recipes: Recipe[]): MealEntry[] {
  const entries: MealEntry[] = [];
  for (let i = BASE_DAY; i >= 0; i--) {
    const date = offsetDate(i);
    // 2-4 meals per day
    const mealCount = rrand(2, 4);
    const cats = [...MEAL_CATEGORIES].sort(() => rrand(-1, 1)).slice(0, mealCount);
    for (const cat of cats) {
      // 60% recipe, 40% single food
      const useRecipe = rrand(0, 100) < 60;
      if (useRecipe) {
        const recipe = pick(recipes);
        const qty = rrand(1, 1.3);
        entries.push({
          id: newId(),
          date,
          mealCategory: cat,
          foodId: undefined,
          foodSnapshot: { name: recipe.name, category: recipe.category },
          quantity: Math.round(qty * 10) / 10,
          unit: 'servings',
          calories: Math.round(recipe.nutritionPerServing.calories * qty * 10) / 10,
          protein: Math.round(recipe.nutritionPerServing.protein * qty * 10) / 10,
          carbs: Math.round(recipe.nutritionPerServing.carbs * qty * 10) / 10,
          fat: Math.round(recipe.nutritionPerServing.fat * qty * 10) / 10,
          fiber: Math.round(recipe.nutritionPerServing.fiber * qty * 10) / 10,
          sugar: Math.round(recipe.nutritionPerServing.sugar * qty * 10) / 10,
          sodium: Math.round(recipe.nutritionPerServing.sodium * qty * 10) / 10,
          createdAt: new Date(date).toISOString(),
          updatedAt: new Date(date).toISOString(),
        });
      } else {
        const food = pick(foods);
        const qty = rrand(0.5, 2);
        const mult = qty / food.servingSize;
        entries.push({
          id: newId(),
          date,
          mealCategory: cat,
          foodId: food.id,
          foodSnapshot: { name: food.name, category: food.category },
          quantity: Math.round(qty * 10) / 10,
          unit: food.servingUnit,
          calories: Math.round(food.calories * mult * 10) / 10,
          protein: Math.round(food.protein * mult * 10) / 10,
          carbs: Math.round(food.carbs * mult * 10) / 10,
          fat: Math.round(food.fat * mult * 10) / 10,
          fiber: Math.round(food.fiber * mult * 10) / 10,
          sugar: Math.round(food.sugar * mult * 10) / 10,
          sodium: Math.round(food.sodium * mult * 10) / 10,
          createdAt: new Date(date).toISOString(),
          updatedAt: new Date(date).toISOString(),
        });
      }
    }
  }
  return entries;
}

// ---------------------------------------------------------------
// Workouts — 20 sessions
// ---------------------------------------------------------------
export function generateWorkoutSessions(): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const categories: WorkoutSession['category'][] = ['walking', 'strength', 'running', 'yoga', 'cycling', 'cardio', 'swimming', 'home'];
  for (let i = 0; i < 20; i++) {
    const daysAgo = rrand(0, 55);
    const date = offsetDate(daysAgo);
    const cat = pick(categories);
    const duration = cat === 'walking' ? rrand(20, 60) : cat === 'yoga' ? rrand(15, 45) : rrand(20, 50);
    sessions.push({
      id: newId(),
      date,
      name: cat === 'strength' ? 'Full Body Strength' : cat === 'running' ? 'Evening Run' : cat === 'walking' ? 'Morning Walk' : cat === 'yoga' ? 'Gentle Yoga' : 'Cardio Session',
      category: cat,
      durationMin: duration,
      distanceKm: cat === 'running' || cat === 'walking' || cat === 'cycling' ? Math.round(rrand(1.5, 5) * 10) / 10 : undefined,
      intensity: pick(['low', 'moderate', 'high']),
      notes: i % 4 === 0 ? 'Felt strong today' : undefined,
      estimatedCalories: Math.round(duration * rrand(5, 10)),
      createdAt: new Date(date).toISOString(),
      updatedAt: new Date(date).toISOString(),
    });
  }
  return sessions;
}

export function generateExerciseLibrary(): ExerciseLibraryItem[] {
  return [
    { id: newId(), name: 'Push-ups', muscleGroup: 'Chest', category: 'strength', defaultReps: 12, defaultSets: 3 },
    { id: newId(), name: 'Squats', muscleGroup: 'Legs', category: 'strength', defaultReps: 15, defaultSets: 3 },
    { id: newId(), name: 'Plank', muscleGroup: 'Core', category: 'strength', defaultReps: 1, defaultSets: 3 },
    { id: newId(), name: 'Dumbbell Row', muscleGroup: 'Back', category: 'strength', defaultReps: 10, defaultSets: 3, defaultWeight: 10 },
    { id: newId(), name: 'Brisk Walk', muscleGroup: 'Legs', category: 'cardio', defaultReps: 30, defaultSets: 1 },
    { id: newId(), name: 'Cat-Cow Stretch', muscleGroup: 'Spine', category: 'flexibility', defaultReps: 10, defaultSets: 1 },
  ];
}

export function generateWorkoutExercises(sessions: WorkoutSession[]): WorkoutExercise[] {
  const ex: WorkoutExercise[] = [];
  const strength = sessions.filter((s) => s.category === 'strength');
  strength.forEach((s) => {
    ['Push-ups', 'Squats', 'Plank'].forEach((name) => {
      ex.push({
        id: newId(),
        workoutSessionId: s.id,
        exerciseName: name,
        muscleGroup: name === 'Plank' ? 'Core' : name === 'Push-ups' ? 'Chest' : 'Legs',
        sets: 3,
        reps: name === 'Plank' ? 1 : rrand(8, 15),
        weight: name === 'Plank' ? undefined : rrand(0, 12),
        restDurationSec: 60,
        notes: '',
        createdAt: new Date(s.date).toISOString(),
      });
    });
  });
  return ex;
}

// ---------------------------------------------------------------
// Workout plans — 4 weekly plans
// ---------------------------------------------------------------
export function generateWorkoutPlans(): WorkoutPlan[] {
  const plans: WorkoutPlan[] = [];
  const now = new Date();
  const daysAgo = 28; // start 4 weeks ago
  const categories: WorkoutPlan['category'][] = ['walking', 'strength', 'yoga', 'cardio'];
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo - 28 + w * 7 + d);
      date.setHours(12, 0, 0, 0);
      const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      // rest on Sundays (d === 0)
      if (d === 0) continue;
      const cat = pick(categories);
      plans.push({
        id: newId(),
        date: ds,
        name: cat === 'strength' ? 'Strength Session' : cat === 'yoga' ? 'Yoga Flow' : cat === 'walking' ? 'Walk' : 'Cardio',
        category: cat,
        durationMin: cat === 'yoga' ? 30 : cat === 'walking' ? 30 : 45,
        status: ds < nowStr ? 'completed' : 'planned',
        notes: '',
        createdAt: new Date(ds).toISOString(),
        updatedAt: new Date(ds).toISOString(),
      });
    }
  }
  return plans;
}

// ---------------------------------------------------------------
// Habits — built-in + custom
// ---------------------------------------------------------------
export function generateHabits(): Habit[] {
  return [
    { id: newId(), name: 'Water Intake', category: 'water', color: '#2E9D59', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Sleep', category: 'sleep', color: '#176B3A', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Steps', category: 'steps', color: '#A8DDB5', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Meditation', category: 'meditation', color: '#E7BB59', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Exercise', category: 'exercise', color: '#2E9D59', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Fruit & Veg', category: 'fruitVeg', color: '#A8DDB5', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Stretching', category: 'stretching', color: '#176B3A', isBuiltIn: true, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Reading', category: 'custom', color: '#718078', isBuiltIn: false, isArchived: false, targetPerDay: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}

export function generateHabitEntries(habits: Habit[]): HabitEntry[] {
  const entries: HabitEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = offsetDate(i);
    for (const h of habits) {
      if (h.isArchived) continue;
      const completed = Math.random() < 0.72;
      entries.push({
        id: newId(),
        habitId: h.id,
        date,
        completed,
        value: completed ? rrand(1, 3) : undefined,
        notes: '',
        createdAt: new Date(date).toISOString(),
        updatedAt: new Date(date).toISOString(),
      });
    }
  }
  return entries;
}

// ---------------------------------------------------------------
// Water & sleep
// ---------------------------------------------------------------
export function generateWaterEntries(): WaterEntry[] {
  const entries: WaterEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = offsetDate(i);
    const glasses = rrand(4, 9);
    entries.push({
      id: newId(),
      date,
      amountMl: glasses * 250,
      notes: '',
      createdAt: new Date(date).toISOString(),
      updatedAt: new Date(date).toISOString(),
    });
  }
  return entries;
}

export function generateSleepEntries(): SleepEntry[] {
  const entries: SleepEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = offsetDate(i);
    entries.push({
      id: newId(),
      date,
      durationHours: rrand(5.5, 8.5),
      quality: pick([1, 2, 3, 4, 5] as const),
      mood: pick([1, 2, 3, 4, 5] as const),
      energy: pick([1, 2, 3, 4, 5] as const),
      notes: '',
      createdAt: new Date(date).toISOString(),
      updatedAt: new Date(date).toISOString(),
    });
  }
  return entries;
}

// ---------------------------------------------------------------
// Goals & milestones
// ---------------------------------------------------------------
export function generateGoals(): Goal[] {
  return [
    { id: newId(), name: 'Reach 75 kg', category: 'weight', startDate: offsetDate(60), targetDate: offsetDate(0), startingValue: 84, targetValue: 75, unit: 'kg', currentProgress: 76, notes: '', status: 'active', direction: 'decrease', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Walk 10,000 steps daily', category: 'steps', startDate: offsetDate(30), targetDate: offsetDate(0), startingValue: 0, targetValue: 300000, unit: 'steps', currentProgress: 185000, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Exercise 3x per week', category: 'workoutFrequency', startDate: offsetDate(30), targetDate: offsetDate(0), startingValue: 0, targetValue: 12, unit: 'sessions', currentProgress: 10, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Drink 2.2 L water daily', category: 'water', startDate: offsetDate(30), targetDate: offsetDate(0), startingValue: 0, targetValue: 66000, unit: 'ml', currentProgress: 52000, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Sleep 7 hours nightly', category: 'sleep', startDate: offsetDate(30), targetDate: offsetDate(0), startingValue: 0, targetValue: 210, unit: 'hours', currentProgress: 140, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Reduce waist to 84 cm', category: 'measurement', startDate: offsetDate(60), targetDate: offsetDate(0), startingValue: 94, targetValue: 84, unit: 'cm', currentProgress: 88, notes: '', status: 'active', direction: 'decrease', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Bench press 60 kg', category: 'workoutDuration', startDate: offsetDate(30), targetDate: offsetDate(0), startingValue: 40, targetValue: 60, unit: 'kg', currentProgress: 50, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Run 5 km without stopping', category: 'custom', startDate: offsetDate(40), targetDate: offsetDate(0), startingValue: 2, targetValue: 5, unit: 'km', currentProgress: 4, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Meditate daily', category: 'custom', startDate: offsetDate(21), targetDate: offsetDate(0), startingValue: 0, targetValue: 21, unit: 'days', currentProgress: 14, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: newId(), name: 'Eat 5 servings fruit/veg daily', category: 'nutrition', startDate: offsetDate(14), targetDate: offsetDate(0), startingValue: 0, targetValue: 70, unit: 'servings', currentProgress: 40, notes: '', status: 'active', direction: 'increase', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}

export function generateMilestones(goals: Goal[]): Milestone[] {
  const miles: Milestone[] = [];
  const weightGoal = goals.find((g) => g.name === 'Reach 75 kg');
  if (weightGoal) {
    miles.push({ id: newId(), goalId: weightGoal.id, name: 'First 2 kg lost', targetValue: 82, achievedAt: offsetDate(40), createdAt: new Date().toISOString() });
    miles.push({ id: newId(), goalId: weightGoal.id, name: 'Halfway there', targetValue: 79, achievedAt: offsetDate(20), createdAt: new Date().toISOString() });
  }
  const walkGoal = goals.find((g) => g.name === 'Walk 10,000 steps daily');
  if (walkGoal) {
    miles.push({ id: newId(), goalId: walkGoal.id, name: '100k steps', targetValue: 100000, achievedAt: offsetDate(15), createdAt: new Date().toISOString() });
  }
  return miles;
}

// ---------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------
export function generateChallenges(): Challenge[] {
  return [
    { id: newId(), name: '7-Day Water Challenge', category: 'water', startDate: offsetDate(7), endDate: offsetDate(0), target: 1, unit: 'glasses/day', isActive: true, createdAt: new Date().toISOString() },
    { id: newId(), name: 'No-Sugar Week', category: 'nutrition', startDate: offsetDate(7), endDate: offsetDate(0), target: 7, unit: 'days', isActive: false, createdAt: new Date().toISOString() },
    { id: newId(), name: 'Move Every Day', category: 'exercise', startDate: offsetDate(14), endDate: offsetDate(0), target: 14, unit: 'days', isActive: true, createdAt: new Date().toISOString() },
  ];
}

export function generateChallengeEntries(): ChallengeEntry[] {
  return [];
}

// ---------------------------------------------------------------
// Journal entries
// ---------------------------------------------------------------
export function generateJournalEntries(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const reflections = [
    'Felt strong today after my morning walk.',
    'Tried a new recipe and really enjoyed it.',
    'Had a tough day but stayed consistent with my habits.',
    'Celebrated a small win — chose water over soda.',
    'Sleep was restless, energy lower than usual.',
    'Proud of completing all planned workouts this week.',
    'Reflecting on progress: small steps add up.',
  ];
  for (let i = 13; i >= 0; i -= 2) {
    const date = offsetDate(i);
    entries.push({
      id: newId(),
      date,
      mood: pick([1, 2, 3, 4, 5] as const),
      energy: pick([1, 2, 3, 4, 5] as const),
      sleepQuality: pick([1, 2, 3, 4, 5] as const),
      reflection: pick(reflections),
      wins: pick(['Logged all meals', 'Completed workout', 'Drank enough water', 'Took a rest day']),
      challenges: pick(['Late-night snacking', 'Skipped stretching', 'Poor sleep']),
      notes: '',
      createdAt: new Date(date).toISOString(),
      updatedAt: new Date(date).toISOString(),
    });
  }
  return entries;
}

// ---------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------
export function generateAchievements(): Achievement[] {
  return [
    { id: newId(), name: 'First Step', description: 'Logged your first weight entry.', badge: 'CheckCircle', color: '#2E9D59', earnedAt: offsetDate(60), category: 'milestone' },
    { id: newId(), name: 'Week Warrior', description: 'Tracked nutrition for 7 consecutive days.', badge: 'Flame', color: '#E7BB59', earnedAt: offsetDate(53), category: 'consistency' },
    { id: newId(), name: 'Steady Streak', description: 'Completed a habit for 14 days in a row.', badge: 'Zap', color: '#A8DDB5', earnedAt: offsetDate(46), category: 'consistency' },
    { id: newId(), name: 'Movement Maker', description: 'Completed 10 workout sessions.', badge: 'Dumbbell', color: '#2E9D59', earnedAt: offsetDate(30), category: 'activity' },
    { id: newId(), name: 'Rest & Recover', description: 'Logged 7 nights of sleep data.', badge: 'Moon', color: '#176B3A', earnedAt: offsetDate(20), category: 'recovery' },
    { id: newId(), name: 'Milestone Reached', description: 'Achieved your first weight milestone.', badge: 'Award', color: '#E7BB59', earnedAt: offsetDate(40), category: 'milestone' },
  ];
}

// ---------------------------------------------------------------
// Grocery items
// ---------------------------------------------------------------
export function generateGroceryItems(): GroceryItem[] {
  const items: GroceryItem[] = [];
  const names = ['Rolled Oats', 'Chicken Breast', 'Brown Rice', 'Avocado', 'Banana', 'Eggs', 'Salmon', 'Greek Yogurt', 'Almonds', 'Broccoli', 'Quinoa', 'Apple', 'Spinach', 'Peanut Butter', 'Whole Grain Bread', 'Cottage Cheese', 'Sweet Potato', 'Tofu', 'Olive Oil', 'Blueberries', 'Chickpeas', 'Milk', 'Whole Wheat Pasta', 'Turkey Breast', 'Dark Chocolate', 'Carrots', 'Cucumber', 'Protein Powder', 'Black Beans', 'Green Tea'];
  const categories: string[] = ['Produce', 'Protein', 'Grains', 'Dairy', 'Pantry', 'Snacks', 'Beverages'];
  for (let i = 0; i < 30; i++) {
    const name = names[i % names.length];
    const purchased = Math.random() < 0.5;
    items.push({
      id: newId(),
      name,
      category: pick(categories),
      quantity: Math.round(rrand(1, 5) * 10) / 10,
      unit: pick(['kg', 'g', 'pieces', 'L', 'ml']),
      estimatedPrice: Math.round(rrand(1, 12) * 100) / 100,
      actualPrice: purchased ? Math.round(rrand(1, 12) * 100) / 100 : undefined,
      purchased,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

// ---------------------------------------------------------------
// Meal plans — 4 weekly plans
// ---------------------------------------------------------------
export function generateMealPlans(recipes: Recipe[]): MealPlan[] {
  const plans: MealPlan[] = [];
  const cats: MealPlan['mealCategory'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
  let planCount = 0;
  for (let w = 0; w < 4 && planCount < 28; w++) {
    for (let d = 0; d < 7 && planCount < 28; d++) {
      const date = new Date();
      date.setDate(date.getDate() - 28 + w * 7 + d);
      date.setHours(12, 0, 0, 0);
      const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const cat = pick(cats);
      const recipe = pick(recipes);
      plans.push({
        id: newId(),
        date: ds,
        mealCategory: cat,
        type: 'recipe',
        recipeId: recipe.id,
        quantity: 1,
        unit: 'servings',
        createdAt: new Date(ds).toISOString(),
        updatedAt: new Date(ds).toISOString(),
      });
      planCount++;
    }
  }
  return plans;
}

// ---------------------------------------------------------------
// Assemble everything
// ---------------------------------------------------------------
export function generateDemoData() {
  const foods = generateFoodItems();
  const recipes = generateRecipes(foods);
  const weightEntries = generateWeightEntries();
  const bodyMeasurements = generateBodyMeasurements();
  const mealEntries = generateMealEntries(foods, recipes);
  const workoutSessions = generateWorkoutSessions();
  const exerciseLibrary = generateExerciseLibrary();
  const workoutExercises = generateWorkoutExercises(workoutSessions);
  const workoutPlans = generateWorkoutPlans();
  const habits = generateHabits();
  const habitEntries = generateHabitEntries(habits);
  const waterEntries = generateWaterEntries();
  const sleepEntries = generateSleepEntries();
  const goals = generateGoals();
  const milestones = generateMilestones(goals);
  const challenges = generateChallenges();
  const challengeEntries = generateChallengeEntries();
  const journalEntries = generateJournalEntries();
  const achievements = generateAchievements();
  const groceryItems = generateGroceryItems();
  const mealPlans = generateMealPlans(recipes);

  return {
    profile: DEMO_PROFILE,
    settings: DEMO_SETTINGS,
    records: {
      weightEntries,
      bodyMeasurements,
      bodyCompositions: [],
      foodItems: foods,
      mealEntries,
      recipes,
      mealPlans,
      groceryItems,
      workoutSessions,
      workoutExercises,
      exerciseLibrary,
      workoutPlans,
      habits,
      habitEntries,
      sleepEntries,
      waterEntries,
      goals,
      milestones,
      challenges,
      challengeEntries,
      progressPhotos: [],
      journalEntries,
      achievements,
      calendarEvents: [],
    },
  };
}