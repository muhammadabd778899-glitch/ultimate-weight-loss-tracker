/**
 * Ultimate Weight Loss & Fitness Tracker
 * Core TypeScript data model
 *
 * Every record has a stable unique ID (UUID v4 style).
 * Dates are stored as ISO local-date strings (YYYY-MM-DD) to avoid UTC shifts.
 * Timestamps are ISO 8601 UTC strings for audit ordering only.
 */

export type ID = string;
export type LocalDate = string; // YYYY-MM-DD, never converted to/from UTC
export type Timestamp = string; // ISO 8601

export type WeightUnit = 'kg' | 'lb' | 'st';
export type MeasurementUnit = 'cm' | 'in';
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type WeekStart = 0 | 1 | 6;
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR';

export function newId(): ID {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function today(): LocalDate {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Convert kg <-> lb <-> st */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  const toKg = (v: number, u: WeightUnit) => {
    if (u === 'kg') return v;
    if (u === 'lb') return v * 0.45359237;
    if (u === 'st') return v * 6.35029318;
    return v;
  };
  const fromKg = (v: number, u: WeightUnit) => {
    if (u === 'kg') return v;
    if (u === 'lb') return v / 0.45359237;
    if (u === 'st') return v / 6.35029318;
    return v;
  };
  return fromKg(toKg(value, from), to);
}

export function convertMeasurement(value: number, from: MeasurementUnit, to: MeasurementUnit): number {
  if (from === to) return value;
  if (from === 'cm' && to === 'in') return value / 2.54;
  if (from === 'in' && to === 'cm') return value * 2.54;
  return value;
}

export function formatWeight(value: number, unit: WeightUnit): string {
  const sym = unit === 'kg' ? 'kg' : unit === 'lb' ? 'lb' : 'st';
  return `${value.toFixed(1)} ${sym}`;
}

export function formatMeasurement(value: number, unit: MeasurementUnit): string {
  const sym = unit === 'cm' ? 'cm' : 'in';
  return `${value.toFixed(1)} ${sym}`;
}

export function parseLocalDate(dateStr: string): Date {
  // YYYY-MM-DD -> local Date at noon to avoid tz shift
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

export function formatLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ---------------------------------------------------------------- */
/* Core entities                                                    */
/* ---------------------------------------------------------------- */

export interface UserProfile {
  id: ID;
  displayName: string;
  heightCm?: number;
  heightIn?: number;
  preferredWeightUnit: WeightUnit;
  preferredMeasurementUnit: MeasurementUnit;
  dateFormat: DateFormat;
  weekStart: WeekStart;
  currency: Currency;
  dailyWaterTargetMl: number;
  demoMode: boolean;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettings {
  id: ID;
  preferredDashboardMetrics: string[];
  customFoodCategories: string[];
  customWorkoutCategories: string[];
  customHabits: string[];
  notificationsEnabled: boolean;
  reducedMotion: boolean;
  updatedAt: Timestamp;
}

export interface WeightEntry {
  id: ID;
  date: LocalDate;
  weight: number;
  unit: WeightUnit;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BodyMeasurement {
  id: ID;
  date: LocalDate;
  type: 'waist' | 'hips' | 'chest' | 'neck' | 'shoulders' | 'leftArm' | 'rightArm' | 'leftThigh' | 'rightThigh' | 'leftCalf' | 'rightCalf' | 'custom';
  customLabel?: string;
  value: number;
  unit: MeasurementUnit;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BodyComposition {
  id: ID;
  date: LocalDate;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  waterPercent?: number;
  boneMassKg?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FoodItem {
  id: ID;
  name: string;
  category: string;
  brand?: string;
  servingSize: number;
  servingUnit: string; // g, ml, oz, piece, cup, etc.
  calories: number; // per serving
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  isCustom: boolean;
  isFavorite: boolean;
  notes?: string;
  disclaimerNote?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MealEntry {
  id: ID;
  date: LocalDate;
  mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId?: ID;
  foodSnapshot: Partial<FoodItem>; // denormalized nutrition at time of logging
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecipeIngredient {
  id: ID;
  foodId?: ID;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface Recipe {
  id: ID;
  name: string;
  description?: string;
  category: string;
  ingredients: RecipeIngredient[];
  servings: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  instructions?: string;
  notes?: string;
  imageDataUrl?: string; // local only
  nutritionPerServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number };
  isFavorite: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MealPlan {
  id: ID;
  date: LocalDate;
  mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  type: 'recipe' | 'custom';
  recipeId?: ID;
  customName?: string;
  customNutrition?: { calories: number; protein: number; carbs: number; fat: number };
  quantity: number;
  unit: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroceryItem {
  id: ID;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  actualPrice?: number;
  purchased: boolean;
  mealPlanId?: ID;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkoutSession {
  id: ID;
  date: LocalDate;
  name: string;
  category: 'strength' | 'cardio' | 'walking' | 'running' | 'cycling' | 'swimming' | 'yoga' | 'pilates' | 'flexibility' | 'home' | 'other';
  durationMin: number;
  distanceKm?: number;
  intensity: 'low' | 'moderate' | 'high';
  notes?: string;
  estimatedCalories?: number; // labelled estimate
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExerciseLibraryItem {
  id: ID;
  name: string;
  muscleGroup: string;
  category: 'strength' | 'cardio' | 'flexibility';
  defaultReps?: number;
  defaultSets?: number;
  defaultWeight?: number;
}

export interface WorkoutExercise {
  id: ID;
  workoutSessionId: ID;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight?: number;
  restDurationSec?: number;
  notes?: string;
  createdAt: Timestamp;
}

export interface WorkoutPlan {
  id: ID;
  date: LocalDate;
  name: string;
  category: WorkoutSession['category'];
  durationMin: number;
  status: 'planned' | 'completed' | 'missed';
  workoutSessionId?: ID;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Habit {
  id: ID;
  name: string;
  category: 'water' | 'sleep' | 'steps' | 'walking' | 'meditation' | 'stretching' | 'exercise' | 'fruitVeg' | 'custom';
  color: string;
  isBuiltIn: boolean;
  isArchived: boolean;
  targetPerDay: number; // 1 = daily
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HabitEntry {
  id: ID;
  habitId: ID;
  date: LocalDate;
  completed: boolean;
  value?: number; // e.g. glasses of water, hours slept
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SleepEntry {
  id: ID;
  date: LocalDate;
  durationHours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  mood?: 1 | 2 | 3 | 4 | 5;
  energy?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WaterEntry {
  id: ID;
  date: LocalDate;
  amountMl: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Goal {
  id: ID;
  name: string;
  category: 'weight' | 'measurement' | 'workoutFrequency' | 'workoutDuration' | 'nutrition' | 'water' | 'sleep' | 'steps' | 'custom';
  startDate: LocalDate;
  targetDate: LocalDate;
  startingValue: number;
  targetValue: number;
  unit: string;
  currentProgress: number;
  notes?: string;
  status: 'active' | 'completed' | 'archived';
  direction: 'increase' | 'decrease' | 'neutral';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Milestone {
  id: ID;
  goalId: ID;
  name: string;
  targetValue: number;
  achievedAt?: LocalDate;
  createdAt: Timestamp;
}

export interface Challenge {
  id: ID;
  name: string;
  category: string;
  startDate: LocalDate;
  endDate: LocalDate;
  target: number;
  unit: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface ChallengeEntry {
  id: ID;
  challengeId: ID;
  date: LocalDate;
  value: number;
  completed: boolean;
}

export interface CalendarEvent {
  id: ID;
  date: LocalDate;
  type: 'weight' | 'measurement' | 'meal' | 'workout' | 'habit' | 'water' | 'sleep' | 'goal' | 'journal';
  title: string;
  recordId: ID;
  color: string;
}

export interface ProgressPhoto {
  id: ID;
  date: LocalDate;
  notes?: string;
  category: 'front' | 'side' | 'back' | 'other';
  imageDataUrl?: string; // IndexedDB blob, local only
  fileName?: string;
  fileSize?: number;
  createdAt: Timestamp;
}

export interface JournalEntry {
  id: ID;
  date: LocalDate;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  reflection?: string;
  wins?: string;
  challenges?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Achievement {
  id: ID;
  name: string;
  description: string;
  badge: string; // lucide icon name
  color: string;
  earnedAt?: LocalDate;
  category: 'consistency' | 'activity' | 'strength' | 'recovery' | 'milestone';
}

/* ---------------------------------------------------------------- */
/* Aggregates & UI helpers                                          */
/* ---------------------------------------------------------------- */

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  waterMl: number;
}

export interface MacroPct { protein: number; carbs: number; fat: number; }

export interface BmiResult {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  label: string;
}

export interface DashboardSnapshot {
  currentWeight?: number;
  weightChange?: number;
  goalProgressPct?: number;
  todayCalories: number;
  todayProtein: number;
  todayWaterMl: number;
  workoutsThisWeek: number;
  habitCompletionPct: number;
  avgSleepHours?: number;
}

export interface BackupData {
  schemaVersion: number;
  exportedAt: Timestamp;
  profile: UserProfile | null;
  settings: UserSettings | null;
  records: {
    weightEntries: WeightEntry[];
    bodyMeasurements: BodyMeasurement[];
    bodyCompositions: BodyComposition[];
    foodItems: FoodItem[];
    mealEntries: MealEntry[];
    recipes: Recipe[];
    mealPlans: MealPlan[];
    groceryItems: GroceryItem[];
    workoutSessions: WorkoutSession[];
    workoutExercises: WorkoutExercise[];
    exerciseLibrary: ExerciseLibraryItem[];
    workoutPlans: WorkoutPlan[];
    habits: Habit[];
    habitEntries: HabitEntry[];
    sleepEntries: SleepEntry[];
    waterEntries: WaterEntry[];
    goals: Goal[];
    milestones: Milestone[];
    challenges: Challenge[];
    challengeEntries: ChallengeEntry[];
    progressPhotos: ProgressPhoto[];
    journalEntries: JournalEntry[];
    achievements: Achievement[];
    calendarEvents: CalendarEvent[];
  };
}
