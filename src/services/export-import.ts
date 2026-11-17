/**
 * Ultimate Weight Loss & Fitness Tracker
 * Backup, import, export service
 * JSON backup + CSV exports
 */

import type { BackupData } from '../types';
import { db } from '../db';

/* ---------------------------------------------------------------- */
/* JSON backup                                                      */
/* ---------------------------------------------------------------- */

export async function exportJSON(): Promise<BackupData> {
  const data = await db.exportAll();
  return data;
}

export function backupToJsonString(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

export function validateBackup(text: string): { valid: boolean; data?: BackupData; error?: string; summary?: any } {
  try {
    const parsed = JSON.parse(text) as BackupData;
    if (!parsed || typeof parsed !== 'object') throw new Error('Not an object');
    if (parsed.schemaVersion == null) throw new Error('Missing schemaVersion');
    if (!parsed.records) throw new Error('Missing records');
    const r = parsed.records;
    const required: Array<keyof typeof r> = [
      'weightEntries','bodyMeasurements','bodyCompositions','foodItems','mealEntries','recipes',
      'mealPlans','groceryItems','workoutSessions','workoutExercises','exerciseLibrary','workoutPlans',
      'habits','habitEntries','sleepEntries','waterEntries','goals','milestones','challenges',
      'challengeEntries','progressPhotos','journalEntries','achievements','calendarEvents',
    ];
    for (const key of required) {
      if (!Array.isArray(r[key])) throw new Error(`Missing or invalid records.${key}`);
    }
    // count summary
    const summary: Record<string, number> = {};
    for (const key of required) summary[key] = r[key].length;
    return { valid: true, data: parsed, summary };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

export async function importJSON(text: string): Promise<{ ok: boolean; summary?: any; error?: string }> {
  const validation = validateBackup(text);
  if (!validation.valid || !validation.data) {
    return { ok: false, error: validation.error };
  }
  try {
    await db.importAll(validation.data);
    return { ok: true, summary: validation.summary };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Import failed' };
  }
}

/* ---------------------------------------------------------------- */
/* CSV export                                                       */
/* ---------------------------------------------------------------- */

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csv(rows: any[], fields: string[]): string {
  const header = fields.join(',');
  const body = rows.map((r) => fields.map((f) => escapeCsv(r[f])).join(',')).join('\n');
  return [header, body].filter(Boolean).join('\n');
}

export function exportWeightCSV(entries: any[]): string {
  return csv(entries, ['id','date','weight','unit','notes','createdAt','updatedAt']);
}
export function exportMeasurementsCSV(entries: any[]): string {
  return csv(entries, ['id','date','type','customLabel','value','unit','notes','createdAt','updatedAt']);
}
export function exportNutritionCSV(entries: any[]): string {
  return csv(entries, ['id','date','mealCategory','foodName','quantity','unit','calories','protein','carbs','fat','fiber','sugar','sodium','createdAt']);
}
export function exportWorkoutsCSV(entries: any[]): string {
  return csv(entries, ['id','date','name','category','durationMin','distanceKm','intensity','estimatedCalories','notes','createdAt']);
}
export function exportHabitsCSV(entries: any[]): string {
  return csv(entries, ['id','habitId','date','completed','value','notes','createdAt','updatedAt']);
}
export function exportGoalsCSV(entries: any[]): string {
  return csv(entries, ['id','name','category','startDate','targetDate','startingValue','targetValue','unit','currentProgress','status','direction','createdAt']);
}
export function exportGroceryCSV(entries: any[]): string {
  return csv(entries, ['id','name','category','quantity','unit','estimatedPrice','actualPrice','purchased','mealPlanId','notes','createdAt']);
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
