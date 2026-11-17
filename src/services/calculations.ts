/**
 * Ultimate Weight Loss & Fitness Tracker
 * Calculation service — all values derived from real records, never hardcoded.
 */

import type {
  WeightEntry, BodyMeasurement, MealEntry, WorkoutSession,
  Habit, HabitEntry, SleepEntry, WaterEntry, Goal, UserProfile,
  DashboardSnapshot, DailyNutritionTotals, MacroPct, BmiResult,
  MeasurementUnit,
} from '../types';
import { convertWeight, convertMeasurement, today, parseLocalDate, daysBetween, addDays } from '../types';

/* ---------------------------------------------------------------- */
/* Weight                                                           */
/* ---------------------------------------------------------------- */

export function getLatestWeight(entries: WeightEntry[], preferredUnit: WeightEntry['unit'] = 'kg'): { value: number; unit: string; date?: string } | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const latest = sorted[sorted.length - 1];
  return { value: convertWeight(latest.weight, latest.unit, preferredUnit), unit: preferredUnit, date: latest.date };
}

export function getStartingWeight(entries: WeightEntry[], preferredUnit: WeightEntry['unit'] = 'kg'): number | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return convertWeight(sorted[0].weight, sorted[0].unit, preferredUnit);
}

export function weightStats(entries: WeightEntry[], preferredUnit: WeightEntry['unit'] = 'kg') {
  if (!entries.length) return { current: null, start: null, change: null, pctChange: null, count: 0, unit: preferredUnit };
  const current = getLatestWeight(entries, preferredUnit);
  const start = getStartingWeight(entries, preferredUnit);
  const change = current && start !== null ? current.value - start : null;
  const pctChange = start && change !== null ? ((change / start) * 100) : null;
  return { current: current?.value ?? null, start, change, pctChange, count: entries.length, unit: preferredUnit, latestDate: current?.date };
}

export function calculateBMI(weightKg: number, heightCm: number): BmiResult {
  const hM = heightCm / 100;
  const bmi = Math.round((weightKg / (hM * hM)) * 10) / 10;
  let category: BmiResult['category'] = 'normal';
  let label: string;
  if (bmi < 18.5) { category = 'underweight'; label = 'Underweight'; }
  else if (bmi < 25) { category = 'normal'; label = 'Healthy weight'; }
  else if (bmi < 30) { category = 'overweight'; label = 'Overweight'; }
  else { category = 'obese'; label = 'Obesity'; }
  return { bmi, category, label };
}

/* ---------------------------------------------------------------- */
/* Measurements                                                     */
/* ---------------------------------------------------------------- */

export function measurementHistory(measurements: BodyMeasurement[], type: BodyMeasurement['type'], preferredUnit: MeasurementUnit = 'cm') {
  return measurements
    .filter((m) => m.type === type)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((m) => ({ date: m.date, value: convertMeasurement(m.value, m.unit, preferredUnit), unit: preferredUnit }));
}

/* ---------------------------------------------------------------- */
/* Nutrition                                                        */
/* ---------------------------------------------------------------- */

export function dailyTotals(entries: MealEntry[], date: string): DailyNutritionTotals {
  const day = entries.filter((e) => e.date === date);
  return day.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + e.fiber,
      sugar: acc.sugar + e.sugar,
      sodium: acc.sodium + e.sodium,
      waterMl: acc.waterMl,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, waterMl: 0 },
  );
}

export function macroPct(totals: DailyNutritionTotals): MacroPct {
  const total = totals.protein + totals.carbs + totals.fat;
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((totals.protein / total) * 100),
    carbs: Math.round((totals.carbs / total) * 100),
    fat: Math.round((totals.fat / total) * 100),
  };
}

export function weeklyCalories(entries: MealEntry[], endDate: string): { date: string; calories: number }[] {
  const end = parseLocalDate(endDate);
  const days: { date: string; calories: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const cal = entries.filter((e) => e.date === ds).reduce((s, e) => s + e.calories, 0);
    days.push({ date: ds, calories: cal });
  }
  return days;
}

export function monthlyCalories(entries: MealEntry[], year: number, month: number): { date: string; calories: number }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: string; calories: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d, 12, 0, 0, 0);
    const ds = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const cal = entries.filter((e) => e.date === ds).reduce((s, e) => s + e.calories, 0);
    days.push({ date: ds, calories: cal });
  }
  return days;
}

/* ---------------------------------------------------------------- */
/* Water                                                            */
/* ---------------------------------------------------------------- */

export function dailyWater(entries: WaterEntry[], date: string): number {
  return entries.filter((e) => e.date === date).reduce((s, e) => s + e.amountMl, 0);
}

/* ---------------------------------------------------------------- */
/* Workouts                                                         */
/* ---------------------------------------------------------------- */

export function workoutsInRange(sessions: WorkoutSession[], start: string, end: string): WorkoutSession[] {
  return sessions.filter((s) => s.date >= start && s.date <= end);
}

export function workoutStats(sessions: WorkoutSession[]) {
  const totalMinutes = sessions.reduce((s, w) => s + w.durationMin, 0);
  const totalCalories = sessions.reduce((s, w) => s + (w.estimatedCalories || 0), 0);
  const categoryCount: Record<string, number> = {};
  sessions.forEach((w) => { categoryCount[w.category] = (categoryCount[w.category] || 0) + 1; });
  const mostFrequent = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  return {
    count: sessions.length,
    totalMinutes,
    totalCalories,
    avgDuration: sessions.length ? Math.round(totalMinutes / sessions.length) : 0,
    categoryCount,
    mostFrequentCategory: mostFrequent ? mostFrequent[0] : '—',
  };
}

export function weeklyWorkoutActivity(sessions: WorkoutSession[], endDate: string): { date: string; minutes: number }[] {
  const end = parseLocalDate(endDate);
  const days: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const min = sessions.filter((s) => s.date === ds).reduce((s, w) => s + w.durationMin, 0);
    days.push({ date: ds, minutes: min });
  }
  return days;
}

/* ---------------------------------------------------------------- */
/* Habits                                                           */
/* ---------------------------------------------------------------- */

export function habitCompletionRate(entries: HabitEntry[], habitId: string, days: number): { completed: number; total: number; pct: number; streak: number } {
  const end = parseLocalDate(today());
  const habitEntries = entries.filter((e) => e.habitId === habitId);
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const e = habitEntries.find((h) => h.date === ds);
    if (e?.completed) completed++;
  }
  const pct = days === 0 ? 0 : Math.round((completed / days) * 100);
  // streak: count consecutive days from today going back
  let streak = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const e = habitEntries.find((h) => h.date === ds);
    if (e?.completed) streak++; else break;
  }
  return { completed, total: days, pct, streak };
}

export function allHabitsCompletion(habits: Habit[], entries: HabitEntry[], days: number) {
  return habits.map((h) => {
    const r = habitCompletionRate(entries, h.id, days);
    return { ...h, ...r };
  });
}

/* ---------------------------------------------------------------- */
/* Sleep                                                            */
/* ---------------------------------------------------------------- */

export function sleepStats(entries: SleepEntry[], days: number): { avgHours: number; count: number; last?: { date: string; hours: number; quality: number } } {
  const end = parseLocalDate(today());
  const recent: SleepEntry[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const e = entries.find((s) => s.date === ds);
    if (e) recent.push(e);
  }
  const avg = recent.length ? Math.round((recent.reduce((s, e) => s + e.durationHours, 0) / recent.length) * 10) / 10 : 0;
  const last = recent.length ? recent.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))[recent.length - 1] : undefined;
  return { avgHours: avg, count: recent.length, last: last ? { date: last.date, hours: last.durationHours, quality: last.quality } : undefined };
}

/* ---------------------------------------------------------------- */
/* Dashboard snapshot                                               */
/* ---------------------------------------------------------------- */

export function buildDashboardSnapshot({
  weightEntries,
  mealEntries,
  waterEntries,
  workoutSessions,
  habitEntries,
  habits,
  sleepEntries,
  goals,
  profile,
}: {
  weightEntries: WeightEntry[];
  mealEntries: MealEntry[];
  waterEntries: WaterEntry[];
  workoutSessions: WorkoutSession[];
  habitEntries: HabitEntry[];
  habits: Habit[];
  sleepEntries: SleepEntry[];
  goals: Goal[];
  profile: UserProfile | null;
}): DashboardSnapshot {
  const now = today();
  const dayTotals = dailyTotals(mealEntries, now);
  const water = dailyWater(waterEntries, now);
  const weekStart = addDays(parseLocalDate(now), -6);
  const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  const workoutsThisWeek = workoutSessions.filter((w) => w.date >= weekStartStr && w.date <= now).length;
  const wStats = weightStats(weightEntries, profile?.preferredWeightUnit || 'kg');
  const sleep = sleepStats(sleepEntries, 7);

  // habit completion over last 7 days across all active habits
  const active = habits.filter((h) => !h.isArchived);
  let totalPct = 0;
  active.forEach((h) => { totalPct += habitCompletionRate(habitEntries, h.id, 7).pct; });
  const habitPct = active.length ? Math.round(totalPct / active.length) : 0;

  return {
    currentWeight: wStats.current ?? 0,
    weightChange: wStats.change ?? 0,
    goalProgressPct: goals.length
      ? Math.round(
          goals.reduce((sum, g) => {
            const span = Math.max(1, daysBetween(parseLocalDate(g.startDate), parseLocalDate(g.targetDate)));
            const elapsed = Math.max(0, daysBetween(parseLocalDate(g.startDate), parseLocalDate(now)));
            const pct = Math.min(100, Math.max(0, (elapsed / span) * 100));
            return sum + pct;
          }, 0) / goals.length,
        )
      : undefined,
    todayCalories: Math.round(dayTotals.calories),
    todayProtein: Math.round(dayTotals.protein * 10) / 10,
    todayWaterMl: water,
    workoutsThisWeek,
    habitCompletionPct: habitPct,
    avgSleepHours: sleep.avgHours,
  };
}

/* ---------------------------------------------------------------- */
/* Goals                                                            */
/* ---------------------------------------------------------------- */

export function goalProgressPct(goal: Goal): number {
  const span = Math.max(1, daysBetween(parseLocalDate(goal.startDate), parseLocalDate(goal.targetDate)));
  const elapsed = Math.max(0, daysBetween(parseLocalDate(goal.startDate), parseLocalDate(today())));
  const timePct = Math.min(100, Math.max(0, (elapsed / span) * 100));
  const valuePct =
    goal.targetValue === 0 ? 0 : Math.min(100, Math.max(0, Math.abs((goal.currentProgress - goal.startingValue) / (goal.targetValue - goal.startingValue)) * 100));
  return Math.round((timePct + valuePct) / 2);
}

export function formatUnitValue(value: number, unit: string): string {
  return `${value.toFixed(1)} ${unit}`;
}
