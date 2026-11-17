import { describe, expect, it } from 'vitest';
import {
  calculateBMI,
  dailyTotals,
  dailyWater,
  goalProgressPct,
  habitCompletionRate,
  macroPct,
  weeklyCalories,
  weightStats,
  workoutStats,
} from '../src/services/calculations';
import {
  addDays,
  parseLocalDate,
  today,
  type Goal,
  type HabitEntry,
  type MealEntry,
  type WaterEntry,
  type WeightEntry,
  type WorkoutSession,
} from '../src/types';

const CREATED = '2026-01-01T00:00:00.000Z';

const weight = (date: string, value: number, unit: 'kg' | 'lb' | 'st' = 'kg'): WeightEntry => ({
  id: `${date}-${value}`,
  date,
  weight: value,
  unit,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const meal = (
  date: string,
  calories: number,
  protein = 0,
  carbs = 0,
  fat = 0
): MealEntry => ({
  id: `${date}-${calories}-${protein}-${carbs}-${fat}`,
  date,
  mealCategory: 'lunch',
  foodSnapshot: {},
  quantity: 1,
  unit: 'serving',
  calories,
  protein,
  carbs,
  fat,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const water = (date: string, amountMl: number): WaterEntry => ({
  id: `${date}-${amountMl}`,
  date,
  amountMl,
  createdAt: CREATED,
  updatedAt: CREATED,
});

const workout = (
  date: string,
  durationMin: number,
  category: WorkoutSession['category']
): WorkoutSession => ({
  id: `${date}-${category}`,
  date,
  name: 'Session',
  category,
  durationMin,
  intensity: 'moderate',
  createdAt: CREATED,
  updatedAt: CREATED,
});

const localDate = (offsetDays: number): string => {
  const d = addDays(parseLocalDate(today()), offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('weightStats', () => {
  it('returns empty values when there are no entries', () => {
    expect(weightStats([])).toMatchObject({ current: null, start: null, change: null, count: 0 });
  });

  it('uses the earliest and latest records regardless of array order', () => {
    const stats = weightStats([weight('2026-11-03', 78.4), weight('2026-11-01', 80)]);
    expect(stats.start).toBe(80);
    expect(stats.current).toBe(78.4);
    expect(stats.change).toBeCloseTo(-1.6, 5);
    expect(stats.count).toBe(2);
  });

  it('converts entries to the preferred unit', () => {
    const stats = weightStats([weight('2026-11-01', 176, 'lb')], 'kg');
    expect(stats.current).toBeCloseTo(79.83, 1);
  });
});

describe('calculateBMI', () => {
  it('classifies a healthy weight', () => {
    expect(calculateBMI(70, 175)).toMatchObject({ category: 'normal', label: 'Healthy weight' });
  });

  it('flags underweight and obesity ranges', () => {
    expect(calculateBMI(50, 175).category).toBe('underweight');
    expect(calculateBMI(95, 175).category).toBe('obese');
  });
});

describe('nutrition totals', () => {
  it('sums only the requested day', () => {
    const totals = dailyTotals(
      [meal('2026-11-17', 400, 20, 40, 10), meal('2026-11-17', 100, 5, 10, 2), meal('2026-11-16', 900)],
      '2026-11-17'
    );
    expect(totals.calories).toBe(500);
    expect(totals.protein).toBe(25);
    expect(totals.carbs).toBe(50);
    expect(totals.fat).toBe(12);
  });

  it('computes macro percentages from grams', () => {
    const pct = macroPct(dailyTotals([meal('2026-11-17', 500, 50, 25, 25)], '2026-11-17'));
    expect(pct).toEqual({ protein: 50, carbs: 25, fat: 25 });
  });

  it('does not divide by zero when nothing is logged', () => {
    expect(macroPct(dailyTotals([], '2026-11-17'))).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('returns a seven-day window ending on the selected date', () => {
    const days = weeklyCalories([meal('2026-11-17', 300)], '2026-11-17');
    expect(days).toHaveLength(7);
    expect(days[6]).toEqual({ date: '2026-11-17', calories: 300 });
  });
});

describe('water', () => {
  it('adds all water logged on a date', () => {
    expect(dailyWater([water('2026-11-17', 250), water('2026-11-17', 500), water('2026-11-16', 900)], '2026-11-17')).toBe(750);
  });
});

describe('workoutStats', () => {
  it('totals duration and finds the most frequent category', () => {
    const stats = workoutStats([
      workout('2026-11-16', 30, 'strength'),
      workout('2026-11-17', 45, 'strength'),
      workout('2026-11-17', 20, 'walking'),
    ]);
    expect(stats.count).toBe(3);
    expect(stats.totalMinutes).toBe(95);
    expect(stats.avgDuration).toBe(32);
    expect(stats.mostFrequentCategory).toBe('strength');
  });
});

describe('habitCompletionRate', () => {
  const entry = (date: string, completed: boolean): HabitEntry => ({
    id: `${date}-${completed}`,
    habitId: 'h1',
    date,
    completed,
    createdAt: CREATED,
    updatedAt: CREATED,
  });

  it('counts a day once even when it has several entries', () => {
    const result = habitCompletionRate(
      [entry(localDate(0), true), entry(localDate(0), true), entry(localDate(-1), true)],
      'h1',
      7
    );
    expect(result.completed).toBe(2);
    expect(result.total).toBe(7);
    expect(result.pct).toBe(29);
    expect(result.streak).toBe(2);
  });

  it('stops the streak at the first missed day', () => {
    const result = habitCompletionRate(
      [entry(localDate(0), true), entry(localDate(-1), false), entry(localDate(-2), true)],
      'h1',
      7
    );
    expect(result.streak).toBe(1);
    expect(result.completed).toBe(2);
  });
});

describe('goalProgressPct', () => {
  const goal = (overrides: Partial<Goal>): Goal => ({
    id: 'g1',
    name: 'Walk more',
    category: 'custom',
    startDate: localDate(-10),
    targetDate: localDate(10),
    startingValue: 0,
    targetValue: 100,
    unit: 'sessions',
    currentProgress: 50,
    status: 'active',
    direction: 'increase',
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  });

  it('stays within 0 and 100', () => {
    expect(goalProgressPct(goal({}))).toBeCloseTo(50, 0);
    expect(goalProgressPct(goal({ currentProgress: 500 }))).toBeLessThanOrEqual(100);
    expect(goalProgressPct(goal({ currentProgress: -50 }))).toBeGreaterThanOrEqual(0);
  });

  it('handles a zero-width target range without NaN', () => {
    const result = goalProgressPct(goal({ startingValue: 50, targetValue: 50, currentProgress: 55 }));
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
