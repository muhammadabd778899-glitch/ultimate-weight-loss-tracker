/**
 * Ultimate Weight Loss & Fitness Tracker
 * Garden gamification service
 *
 * A plant grows as the user builds consistency. Stages:
 * Seed → Sprout → Young plant → Growing plant → Flourishing garden
 *
 * Progress is based on habits & activity completion only.
 * Never punishes missed days. Never resets historical progress.
 */

import type { HabitEntry, Habit, Achievement } from '../types';
import { today, addDays, parseLocalDate } from '../types';

export type GardenStage = 'seed' | 'sprout' | 'young' | 'growing' | 'flourishing';

export interface GardenState {
  stage: GardenStage;
  level: number; // 1-5
  consistencyScore: number; // 0-100
  streakDays: number;
  totalActiveDays: number;
  message: string;
}

const STAGE_INFO: Record<GardenStage, { label: string; emoji: string; message: string }> = {
  seed: { label: 'Seed', emoji: '🌱', message: 'Every journey begins with a single step.' },
  sprout: { label: 'Sprout', emoji: '🌿', message: 'A little care each day helps you grow.' },
  young: { label: 'Young Plant', emoji: '🌿', message: 'Roots are taking hold. Keep going.' },
  growing: { label: 'Growing Plant', emoji: '🌳', message: 'Steady progress — you are building momentum.' },
  flourishing: { label: 'Flourishing Garden', emoji: '🌺', message: 'Your consistency is blooming. Well done.' },
};

export function computeGarden({
  habits,
  habitEntries,
  workouts,
}: {
  habits: Habit[];
  habitEntries: HabitEntry[];
  workouts: any[];
}): GardenState {
  const daysBack = 28;
  const activeHabits = habits.filter((h) => !h.isArchived);
  const end = parseLocalDate(today());

  let completedDays = 0;
  let totalPossible = 0;
  let streak = 0;

  for (let i = 0; i < daysBack; i++) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayHabitEntries = habitEntries.filter((e) => e.date === ds);
    const dayCompleted = dayHabitEntries.filter((e) => e.completed).length;
    const dayActive = activeHabits.length;
    totalPossible += Math.max(1, dayActive);
    completedDays += dayCompleted;

    // streak: consecutive completed days counting back from today
    if (i === 0) {
      // today: count as streak day if at least one habit completed (or any workout)
      const hasWorkout = workouts.some((w) => w.date === ds);
      if (dayCompleted > 0 || hasWorkout) streak = 1;
    } else if (streak === i) {
      const hasWorkout = workouts.some((w) => w.date === ds);
      if (dayCompleted > 0 || hasWorkout) streak = i + 1;
    }
  }

  const consistencyScore = totalPossible === 0 ? 0 : Math.round((completedDays / totalPossible) * 100);
  const workoutCount = workouts.length;

  let level: GardenStage = 'seed';
  if (consistencyScore >= 80 && streak >= 14 && workoutCount >= 8) level = 'flourishing';
  else if (consistencyScore >= 60 && streak >= 7 && workoutCount >= 5) level = 'growing';
  else if (consistencyScore >= 40 && streak >= 3 && workoutCount >= 2) level = 'young';
  else if (consistencyScore >= 15 || streak >= 1 || workoutCount >= 1) level = 'sprout';
  else level = 'seed';

  const info = STAGE_INFO[level];
  let message = info.message;
  if (streak >= 7) message = `You've been consistent for ${streak} days. ${info.message}`;
  else if (workoutCount >= 5) message = `Great work on ${workoutCount} recent sessions. ${info.message}`;

  return {
    stage: level,
    level: ['seed', 'sprout', 'young', 'growing', 'flourishing'].indexOf(level) + 1,
    consistencyScore,
    streakDays: streak,
    totalActiveDays: completedDays,
    message,
  };
}

// ---------------------------------------------------------------
// Achievement evaluation helpers
// ---------------------------------------------------------------

export function checkAchievements({
  achievements,
  habitEntries,
  workouts,
  weightEntries,
}: {
  achievements: Achievement[];
  habitEntries: HabitEntry[];
  workouts: any[];
  weightEntries: any[];
}): { id: string; name: string; badge: string; color: string }[] {
  const earned: { id: string; name: string; badge: string; color: string }[] = [];

  // First Step
  if (weightEntries.length >= 1) {
    const a = achievements.find((x) => x.name === 'First Step');
    if (a) earned.push({ id: a.id, name: a.name, badge: a.badge, color: a.color });
  }
  // Week Warrior: 7 days of meal logging
  const end = parseLocalDate(today());
  let loggedDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (habitEntries.some((e) => e.date === ds && e.completed)) loggedDays++;
  }
  if (loggedDays >= 7) {
    const a = achievements.find((x) => x.name === 'Week Warrior');
    if (a) earned.push({ id: a.id, name: a.name, badge: a.badge, color: a.color });
  }
  // Movement Maker: 10 workouts
  if (workouts.length >= 10) {
    const a = achievements.find((x) => x.name === 'Movement Maker');
    if (a) earned.push({ id: a.id, name: a.name, badge: a.badge, color: a.color });
  }
  return earned;
}

// ---------------------------------------------------------------
// Garden gamification service
// ---------------------------------------------------------------