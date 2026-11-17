/**
 * Ultimate Weight Loss & Fitness Tracker
 * IndexedDB data access layer
 *
 * Single database: UltimateWeightLossDB
 * All records stored locally. Photos stored as blobs in IndexedDB.
 * LocalStorage is used only for lightweight UI prefs (see storage.ts).
 */

import { newId, today } from './types';
import type {
  ID,
  LocalDate,
  BackupData,
  UserProfile,
  UserSettings,
  WeightEntry,
  BodyMeasurement,
  BodyComposition,
  FoodItem,
  MealEntry,
  Recipe,
  MealPlan,
  GroceryItem,
  WorkoutSession,
  ExerciseLibraryItem,
  WorkoutExercise,
  WorkoutPlan,
  Habit,
  HabitEntry,
  SleepEntry,
  WaterEntry,
  Goal,
  Milestone,
  Challenge,
  ChallengeEntry,
  CalendarEvent,
  ProgressPhoto,
  JournalEntry,
  Achievement,
} from './types';

const DB_NAME = 'UltimateWeightLossDB';
const DB_VERSION = 1;
const SCHEMA_VERSION = 1;

type StoreName =
  | '_meta'
  | 'userProfiles'
  | 'userSettings'
  | 'weightEntries'
  | 'bodyMeasurements'
  | 'bodyCompositions'
  | 'foodItems'
  | 'mealEntries'
  | 'recipes'
  | 'mealPlans'
  | 'groceryItems'
  | 'workoutSessions'
  | 'workoutExercises'
  | 'exerciseLibrary'
  | 'workoutPlans'
  | 'habits'
  | 'habitEntries'
  | 'sleepEntries'
  | 'waterEntries'
  | 'goals'
  | 'milestones'
  | 'challenges'
  | 'challengeEntries'
  | 'progressPhotos'
  | 'journalEntries'
  | 'achievements'
  | 'calendarEvents';

interface StoreDef {
  name: StoreName;
  keyPath: string;
  autoIncrement: boolean;
  indexes: { name: string; keyPath: string | string[]; unique?: boolean }[];
}

const STORES: StoreDef[] = [
  { name: 'userProfiles', keyPath: 'id', autoIncrement: false, indexes: [] },
  { name: 'userSettings', keyPath: 'id', autoIncrement: false, indexes: [] },
  {
    name: 'weightEntries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }, { name: 'byDateDesc', keyPath: 'date' }],
  },
  {
    name: 'bodyMeasurements',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }, { name: 'byType', keyPath: 'type' }],
  },
  { name: 'bodyCompositions', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byDate', keyPath: 'date' }] },
  {
    name: 'foodItems',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byCategory', keyPath: 'category' }, { name: 'byName', keyPath: 'name' }],
  },
  {
    name: 'mealEntries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }, { name: 'byDateCategory', keyPath: ['date', 'mealCategory'] }],
  },
  { name: 'recipes', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byCategory', keyPath: 'category' }, { name: 'byName', keyPath: 'name' }] },
  {
    name: 'mealPlans',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }, { name: 'byDateCategory', keyPath: ['date', 'mealCategory'] }],
  },
  {
    name: 'groceryItems',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byPurchased', keyPath: 'purchased' }, { name: 'byCategory', keyPath: 'category' }],
  },
  {
    name: 'workoutSessions',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }, { name: 'byCategory', keyPath: 'category' }],
  },
  {
    name: 'workoutExercises',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byWorkout', keyPath: 'workoutSessionId' }],
  },
  {
    name: 'exerciseLibrary',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byCategory', keyPath: 'category' }, { name: 'byName', keyPath: 'name' }],
  },
  {
    name: 'workoutPlans',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }, { name: 'byStatus', keyPath: 'status' }],
  },
  { name: 'habits', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byCategory', keyPath: 'category' }] },
  {
    name: 'habitEntries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byHabit', keyPath: 'habitId' }, { name: 'byDate', keyPath: 'date' }, { name: 'byHabitDate', keyPath: ['habitId', 'date'] }],
  },
  { name: 'sleepEntries', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byDate', keyPath: 'date' }] },
  { name: 'waterEntries', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byDate', keyPath: 'date' }] },
  { name: 'goals', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byStatus', keyPath: 'status' }] },
  { name: 'milestones', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byGoal', keyPath: 'goalId' }] },
  { name: 'challenges', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byActive', keyPath: 'isActive' }] },
  {
    name: 'challengeEntries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byChallenge', keyPath: 'challengeId' }],
  },
  { name: 'progressPhotos', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byDate', keyPath: 'date' }] },
  {
    name: 'journalEntries',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'byDate', keyPath: 'date' }],
  },
  { name: 'achievements', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byCategory', keyPath: 'category' }] },
  { name: 'calendarEvents', keyPath: 'id', autoIncrement: false, indexes: [{ name: 'byDate', keyPath: 'date' }] },
];

class DBError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DBError';
  }
}

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (req.result as unknown) as IDBDatabase;
      const oldVersion = (event as unknown as { oldVersion: number }).oldVersion;

      // Drop stores that no longer exist in defs (simple migration sweep)
      const existing = new Set<string>();
      for (const s of STORES) existing.add(s.name);
      for (const name of db.objectStoreNames) {
        if (!existing.has(name)) db.deleteObjectStore(name as string);
      }

      for (const def of STORES) {
        if (db.objectStoreNames.contains(def.name)) {
          // ensure indexes exist
          const store = req.transaction!.objectStore(def.name);
          for (const idx of def.indexes) {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
            }
          }
          continue;
        }
        const store = db.createObjectStore(def.name, { keyPath: def.keyPath, autoIncrement: def.autoIncrement });
        for (const idx of def.indexes) {
          store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
        }
      }

      // Store schema version metadata
      if (oldVersion < 1) {
        const meta = db.createObjectStore('_meta', { keyPath: 'key' });
        meta.add({ key: 'schemaVersion', value: SCHEMA_VERSION });
        meta.add({ key: 'createdAt', value: new Date().toISOString() });
      }
    };

    req.onsuccess = () => {
      dbInstance = req.result as unknown as IDBDatabase;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        initPromise = null;
      };
      resolve(dbInstance);
    };

    req.onerror = () => reject(new DBError('Failed to open IndexedDB', req.error));
    req.onblocked = () => reject(new DBError('IndexedDB blocked - close other tabs using this app'));
  });

  return initPromise;
}

function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  initPromise = null;
}

function run<R>(storeName: StoreName, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => R | Promise<R>): Promise<R> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      const resolved = await Promise.resolve(result);
      tx.oncomplete = () => resolve(resolved);
      tx.onerror = () => reject(new DBError(`Transaction failed on ${storeName}`, tx.error));
      tx.onabort = () => reject(new DBError(`Transaction aborted on ${storeName}`));
    } catch (e) {
      reject(e instanceof DBError ? e : new DBError(`Operation failed on ${storeName}`, e));
    }
  });
}

function runMulti<R>(storeNames: StoreName[], mode: IDBTransactionMode, fn: (stores: Map<StoreName, IDBObjectStore>) => R | Promise<R>): Promise<R> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(storeNames, mode);
      const stores = new Map<StoreName, IDBObjectStore>();
      for (const name of storeNames) stores.set(name, tx.objectStore(name));
      const result = fn(stores);
      const resolved = await Promise.resolve(result);
      tx.oncomplete = () => resolve(resolved);
      tx.onerror = () => reject(new DBError('Multi-store transaction failed', tx.error));
      tx.onabort = () => reject(new DBError('Multi-store transaction aborted'));
    } catch (e) {
      reject(e instanceof DBError ? e : new DBError('Multi-store operation failed', e));
    }
  });
}

function getAllFromIndex(store: IDBObjectStore, indexName?: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const source = indexName ? store.index(indexName) : store;
    const req = source.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new DBError('getAll failed', req.error));
  });
}

function getByKey(store: IDBObjectStore, key: ID | number): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new DBError('getByKey failed', req.error));
  });
}

function putRecord(store: IDBObjectStore, record: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new DBError('put failed', req.error));
  });
}

function deleteRecord(store: IDBObjectStore, key: ID | number): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new DBError('delete failed', req.error));
  });
}

/* ---------------------------------------------------------------- */
/* Public API                                                       */
/* ---------------------------------------------------------------- */

export const db = {
  close: closeDB,
  getSchemaVersion: async (): Promise<number> => {
    const row: any = await run('_meta', 'readonly', (s) => getByKey(s, 'schemaVersion'));
    return row?.value ?? SCHEMA_VERSION;
  },

  // ----- generic -----
  get: <T>(store: StoreName, id: ID | number): Promise<T | undefined> => run(store, 'readonly', (s) => getByKey(s, id)),
  getAll: <T>(store: StoreName, indexName?: string): Promise<T[]> => run(store, 'readonly', (s) => getAllFromIndex(s, indexName)),
  put: (store: StoreName, record: any): Promise<void> => run(store, 'readwrite', (s) => putRecord(s, record)),
  delete: (store: StoreName, id: ID | number): Promise<void> => run(store, 'readwrite', (s) => deleteRecord(s, id)),
  clear: (store: StoreName): Promise<void> => run(store, 'readwrite', (s) => new Promise((resolve, reject) => {
    const req = s.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new DBError('clear failed', req.error));
  })),

  // ----- entity CRUD -----
  weight: {
    list: () => db.getAll<WeightEntry>('weightEntries', 'byDateDesc'),
    get: (id: ID) => db.get<WeightEntry>('weightEntries', id),
    add: (r: Omit<WeightEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: WeightEntry = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('weightEntries', record).then(() => record);
    },
    update: (id: ID, r: Partial<WeightEntry>) => db.get<WeightEntry>('weightEntries', id).then((cur) => {
      if (!cur) throw new DBError('Weight entry not found');
      const record: WeightEntry = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('weightEntries', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('weightEntries', id),
  },
  bodyMeasurements: {
    list: () => db.getAll<BodyMeasurement>('bodyMeasurements', 'byDateDesc'),
    get: (id: ID) => db.get<BodyMeasurement>('bodyMeasurements', id),
    add: (r: Omit<BodyMeasurement, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: BodyMeasurement = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('bodyMeasurements', record).then(() => record);
    },
    update: (id: ID, r: Partial<BodyMeasurement>) => db.get<BodyMeasurement>('bodyMeasurements', id).then((cur) => {
      if (!cur) throw new DBError('Measurement not found');
      const record: BodyMeasurement = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('bodyMeasurements', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('bodyMeasurements', id),
  },
  bodyCompositions: {
    list: () => db.getAll<BodyComposition>('bodyCompositions', 'byDateDesc'),
    add: (r: Omit<BodyComposition, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: BodyComposition = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('bodyCompositions', record).then(() => record);
    },
    remove: (id: ID) => db.delete('bodyCompositions', id),
  },
  food: {
    list: () => db.getAll<FoodItem>('foodItems', 'byName'),
    get: (id: ID) => db.get<FoodItem>('foodItems', id),
    add: (r: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: FoodItem = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('foodItems', record).then(() => record);
    },
    update: (id: ID, r: Partial<FoodItem>) => db.get<FoodItem>('foodItems', id).then((cur) => {
      if (!cur) throw new DBError('Food item not found');
      const record: FoodItem = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('foodItems', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('foodItems', id),
  },
  meals: {
    list: () => db.getAll<MealEntry>('mealEntries', 'byDateDesc'),
    get: (id: ID) => db.get<MealEntry>('mealEntries', id),
    add: (r: Omit<MealEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: MealEntry = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('mealEntries', record).then(() => record);
    },
    update: (id: ID, r: Partial<MealEntry>) => db.get<MealEntry>('mealEntries', id).then((cur) => {
      if (!cur) throw new DBError('Meal entry not found');
      const record: MealEntry = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('mealEntries', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('mealEntries', id),
  },
  recipes: {
    list: () => db.getAll<Recipe>('recipes', 'byName'),
    get: (id: ID) => db.get<Recipe>('recipes', id),
    add: (r: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: Recipe = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('recipes', record).then(() => record);
    },
    update: (id: ID, r: Partial<Recipe>) => db.get<Recipe>('recipes', id).then((cur) => {
      if (!cur) throw new DBError('Recipe not found');
      const record: Recipe = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('recipes', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('recipes', id),
  },
  mealPlans: {
    list: () => db.getAll<MealPlan>('mealPlans', 'byDateDesc'),
    get: (id: ID) => db.get<MealPlan>('mealPlans', id),
    add: (r: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: MealPlan = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('mealPlans', record).then(() => record);
    },
    update: (id: ID, r: Partial<MealPlan>) => db.get<MealPlan>('mealPlans', id).then((cur) => {
      if (!cur) throw new DBError('Meal plan not found');
      const record: MealPlan = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('mealPlans', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('mealPlans', id),
  },
  grocery: {
    list: () => db.getAll<GroceryItem>('groceryItems', 'byCategory'),
    get: (id: ID) => db.get<GroceryItem>('groceryItems', id),
    add: (r: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: GroceryItem = { id: newId(), ...r, purchased: false, createdAt: now, updatedAt: now };
      return db.put('groceryItems', record).then(() => record);
    },
    update: (id: ID, r: Partial<GroceryItem>) => db.get<GroceryItem>('groceryItems', id).then((cur) => {
      if (!cur) throw new DBError('Grocery item not found');
      const record: GroceryItem = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('groceryItems', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('groceryItems', id),
    setPurchased: (id: ID, purchased: boolean) =>
      db.get<GroceryItem>('groceryItems', id).then((cur) => {
        if (!cur) throw new DBError('Grocery item not found');
        const record: GroceryItem = { ...cur, purchased, updatedAt: new Date().toISOString() };
        return db.put('groceryItems', record).then(() => record);
      }),
  },
  workouts: {
    list: () => db.getAll<WorkoutSession>('workoutSessions', 'byDateDesc'),
    get: (id: ID) => db.get<WorkoutSession>('workoutSessions', id),
    add: (r: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: WorkoutSession = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('workoutSessions', record).then(() => record);
    },
    update: (id: ID, r: Partial<WorkoutSession>) => db.get<WorkoutSession>('workoutSessions', id).then((cur) => {
      if (!cur) throw new DBError('Workout session not found');
      const record: WorkoutSession = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('workoutSessions', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('workoutSessions', id),
  },
  workoutExercises: {
    list: () => db.getAll<WorkoutExercise>('workoutExercises'),
    add: (r: Omit<WorkoutExercise, 'id' | 'createdAt'>) => {
      const record: WorkoutExercise = { id: newId(), ...r, createdAt: new Date().toISOString() };
      return db.put('workoutExercises', record).then(() => record);
    },
    removeByWorkout: (workoutId: ID) =>
      runMulti(['workoutExercises'], 'readwrite', (stores) => {
        const store = stores.get('workoutExercises')!;
        return new Promise<void>((resolve, reject) => {
          const idx = store.index('byWorkout');
          const req = idx.openCursor(IDBKeyRange.only(workoutId));
          req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (!cursor) return resolve();
            cursor.delete();
            cursor.continue();
          };
          req.onerror = () => reject(new DBError('removeByWorkout failed', req.error));
        });
      }),
  },
  exerciseLibrary: {
    list: () => db.getAll<ExerciseLibraryItem>('exerciseLibrary', 'byName'),
    add: (r: Omit<ExerciseLibraryItem, 'id'>) => db.put('exerciseLibrary', { id: newId(), ...r }).then(() => undefined),
    remove: (id: ID) => db.delete('exerciseLibrary', id),
  },
  workoutPlans: {
    list: () => db.getAll<WorkoutPlan>('workoutPlans', 'byDateDesc'),
    get: (id: ID) => db.get<WorkoutPlan>('workoutPlans', id),
    add: (r: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: WorkoutPlan = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('workoutPlans', record).then(() => record);
    },
    update: (id: ID, r: Partial<WorkoutPlan>) => db.get<WorkoutPlan>('workoutPlans', id).then((cur) => {
      if (!cur) throw new DBError('Workout plan not found');
      const record: WorkoutPlan = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('workoutPlans', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('workoutPlans', id),
  },
  habits: {
    list: () => db.getAll<Habit>('habits'),
    get: (id: ID) => db.get<Habit>('habits', id),
    add: (r: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: Habit = { id: newId(), ...r, isArchived: false, createdAt: now, updatedAt: now };
      return db.put('habits', record).then(() => record);
    },
    update: (id: ID, r: Partial<Habit>) => db.get<Habit>('habits', id).then((cur) => {
      if (!cur) throw new DBError('Habit not found');
      const record: Habit = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('habits', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('habits', id),
    archive: (id: ID) => db.get<Habit>('habits', id).then((cur) => {
      if (!cur) throw new DBError('Habit not found');
      const record: Habit = { ...cur, isArchived: true, updatedAt: new Date().toISOString() };
      return db.put('habits', record).then(() => record);
    }),
  },
  habitEntries: {
    list: () => db.getAll<HabitEntry>('habitEntries', 'byDateDesc'),
    get: (id: ID) => db.get<HabitEntry>('habitEntries', id),
    add: (r: Omit<HabitEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: HabitEntry = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('habitEntries', record).then(() => record);
    },
    upsertDaily: (habitId: ID, date: LocalDate, completed: boolean, value?: number, notes?: string) => {
      const now = new Date().toISOString();
      return db.getAll<HabitEntry>('habitEntries', 'byHabitDate').then((rows) => {
        const existing = rows.find((h) => h.habitId === habitId && h.date === date);
        if (existing) {
          const record: HabitEntry = { ...existing, completed, value, notes, updatedAt: now };
          return db.put('habitEntries', record).then(() => record);
        }
        const record: HabitEntry = { id: newId(), habitId, date, completed, value, notes, createdAt: now, updatedAt: now };
        return db.put('habitEntries', record).then(() => record);
      });
    },
    remove: (id: ID) => db.delete('habitEntries', id),
  },
  sleep: {
    list: () => db.getAll<SleepEntry>('sleepEntries', 'byDateDesc'),
    get: (id: ID) => db.get<SleepEntry>('sleepEntries', id),
    add: (r: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: SleepEntry = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('sleepEntries', record).then(() => record);
    },
    update: (id: ID, r: Partial<SleepEntry>) => db.get<SleepEntry>('sleepEntries', id).then((cur) => {
      if (!cur) throw new DBError('Sleep entry not found');
      const record: SleepEntry = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('sleepEntries', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('sleepEntries', id),
  },
  water: {
    list: () => db.getAll<WaterEntry>('waterEntries', 'byDateDesc'),
    get: (id: ID) => db.get<WaterEntry>('waterEntries', id),
    add: (r: Omit<WaterEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: WaterEntry = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('waterEntries', record).then(() => record);
    },
    update: (id: ID, r: Partial<WaterEntry>) => db.get<WaterEntry>('waterEntries', id).then((cur) => {
      if (!cur) throw new DBError('Water entry not found');
      const record: WaterEntry = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('waterEntries', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('waterEntries', id),
  },
  goals: {
    list: () => db.getAll<Goal>('goals'),
    get: (id: ID) => db.get<Goal>('goals', id),
    add: (r: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: Goal = { id: newId(), ...r, status: 'active', createdAt: now, updatedAt: now };
      return db.put('goals', record).then(() => record);
    },
    update: (id: ID, r: Partial<Goal>) => db.get<Goal>('goals', id).then((cur) => {
      if (!cur) throw new DBError('Goal not found');
      const record: Goal = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('goals', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('goals', id),
  },
  milestones: {
    list: () => db.getAll<Milestone>('milestones'),
    add: (r: Omit<Milestone, 'id' | 'createdAt'>) => {
      const record: Milestone = { id: newId(), ...r, createdAt: new Date().toISOString() };
      return db.put('milestones', record).then(() => record);
    },
    achieve: (id: ID) => db.get<Milestone>('milestones', id).then((cur) => {
      if (!cur) throw new DBError('Milestone not found');
      const record: Milestone = { ...cur, achievedAt: today() };
      return db.put('milestones', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('milestones', id),
  },
  challenges: {
    list: () => db.getAll<Challenge>('challenges'),
    add: (r: Omit<Challenge, 'id' | 'createdAt'>) => {
      const record: Challenge = { id: newId(), ...r, isActive: true, createdAt: new Date().toISOString() };
      return db.put('challenges', record).then(() => record);
    },
    remove: (id: ID) => db.delete('challenges', id),
  },
  challengeEntries: {
    list: () => db.getAll<ChallengeEntry>('challengeEntries'),
    add: (r: Omit<ChallengeEntry, 'id'>) => db.put('challengeEntries', { id: newId(), ...r }).then(() => undefined),
    remove: (id: ID) => db.delete('challengeEntries', id),
  },
  progressPhotos: {
    list: () => db.getAll<ProgressPhoto>('progressPhotos', 'byDateDesc'),
    get: (id: ID) => db.get<ProgressPhoto>('progressPhotos', id),
    add: (r: Omit<ProgressPhoto, 'id' | 'createdAt'>) => {
      const record: ProgressPhoto = { id: newId(), ...r, createdAt: new Date().toISOString() };
      return db.put('progressPhotos', record).then(() => record);
    },
    remove: (id: ID) => db.delete('progressPhotos', id),
  },
  journal: {
    list: () => db.getAll<JournalEntry>('journalEntries', 'byDateDesc'),
    get: (id: ID) => db.get<JournalEntry>('journalEntries', id),
    add: (r: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: JournalEntry = { id: newId(), ...r, createdAt: now, updatedAt: now };
      return db.put('journalEntries', record).then(() => record);
    },
    update: (id: ID, r: Partial<JournalEntry>) => db.get<JournalEntry>('journalEntries', id).then((cur) => {
      if (!cur) throw new DBError('Journal entry not found');
      const record: JournalEntry = { ...cur, ...r, id, updatedAt: new Date().toISOString() };
      return db.put('journalEntries', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('journalEntries', id),
  },
  achievements: {
    list: () => db.getAll<Achievement>('achievements'),
    get: (id: ID) => db.get<Achievement>('achievements', id),
    add: (r: Omit<Achievement, 'id'>) => db.put('achievements', { id: newId(), ...r }).then(() => undefined),
    earn: (id: ID) => db.get<Achievement>('achievements', id).then((cur) => {
      if (!cur) throw new DBError('Achievement not found');
      const record: Achievement = { ...cur, earnedAt: today() };
      return db.put('achievements', record).then(() => record);
    }),
    remove: (id: ID) => db.delete('achievements', id),
  },
  calendarEvents: {
    list: () => db.getAll<CalendarEvent>('calendarEvents', 'byDate'),
    add: (r: Omit<CalendarEvent, 'id'>) => db.put('calendarEvents', { id: newId(), ...r }).then(() => undefined),
    remove: (id: ID) => db.delete('calendarEvents', id),
    clearAll: () => db.clear('calendarEvents'),
  },
  profile: {
    get: () => db.get<UserProfile>('userProfiles', 'profile').then((r) => r ?? null),
    save: (r: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const record: UserProfile = { id: 'profile', ...r, createdAt: now, updatedAt: now };
      return db.put('userProfiles', record).then(() => record);
    },
  },
  settings: {
    get: () => db.get<UserSettings>('userSettings', 'settings').then((r) => r ?? null),
    save: (r: Omit<UserSettings, 'id' | 'updatedAt'>) => {
      const record: UserSettings = { id: 'settings', ...r, updatedAt: new Date().toISOString() };
      return db.put('userSettings', record).then(() => record);
    },
  },

  // ----- full export / restore -----
  exportAll: (): Promise<BackupData> =>
    Promise.all([
      db.profile.get(),
      db.settings.get(),
      db.weight.list(),
      db.bodyMeasurements.list(),
      db.bodyCompositions.list(),
      db.food.list(),
      db.meals.list(),
      db.recipes.list(),
      db.mealPlans.list(),
      db.grocery.list(),
      db.workouts.list(),
      db.workoutExercises.list(),
      db.exerciseLibrary.list(),
      db.workoutPlans.list(),
      db.habits.list(),
      db.habitEntries.list(),
      db.sleep.list(),
      db.water.list(),
      db.goals.list(),
      db.milestones.list(),
      db.challenges.list(),
      db.challengeEntries.list(),
      db.progressPhotos.list(),
      db.journal.list(),
      db.achievements.list(),
      db.calendarEvents.list(),
    ]).then(([
      profile, settings, weight, measurements, compositions, foods, meals, recipes, mealPlans,
      groceries, workouts, workoutExercises, exerciseLibrary, workoutPlans, habits, habitEntries,
      sleeps, waters, goals, milestones, challenges, challengeEntries, photos, journals, achievements,
      calendarEvents,
    ]): BackupData => ({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      records: {
        weightEntries: weight,
        bodyMeasurements: measurements,
        bodyCompositions: compositions,
        foodItems: foods,
        mealEntries: meals,
        recipes,
        mealPlans,
        groceryItems: groceries,
        workoutSessions: workouts,
        workoutExercises,
        exerciseLibrary,
        workoutPlans,
        habits,
        habitEntries,
        sleepEntries: sleeps,
        waterEntries: waters,
        goals,
        milestones,
        challenges,
        challengeEntries,
        progressPhotos: photos,
        journalEntries: journals,
        achievements,
        calendarEvents,
      },
    })),

  importAll: (data: BackupData): Promise<void> => {
    if (data.schemaVersion !== SCHEMA_VERSION) {
      throw new DBError(`Schema version mismatch: expected ${SCHEMA_VERSION}, got ${data.schemaVersion}`);
    }
    const runs: Promise<void>[] = [
      db.clearAndLoad('userProfiles', data.profile ? [data.profile] : []),
      db.clearAndLoad('userSettings', data.settings ? [data.settings] : []),
      db.clearAndLoad('weightEntries', data.records.weightEntries),
      db.clearAndLoad('bodyMeasurements', data.records.bodyMeasurements),
      db.clearAndLoad('bodyCompositions', data.records.bodyCompositions),
      db.clearAndLoad('foodItems', data.records.foodItems),
      db.clearAndLoad('mealEntries', data.records.mealEntries),
      db.clearAndLoad('recipes', data.records.recipes),
      db.clearAndLoad('mealPlans', data.records.mealPlans),
      db.clearAndLoad('groceryItems', data.records.groceryItems),
      db.clearAndLoad('workoutSessions', data.records.workoutSessions),
      db.clearAndLoad('workoutExercises', data.records.workoutExercises),
      db.clearAndLoad('exerciseLibrary', data.records.exerciseLibrary),
      db.clearAndLoad('workoutPlans', data.records.workoutPlans),
      db.clearAndLoad('habits', data.records.habits),
      db.clearAndLoad('habitEntries', data.records.habitEntries),
      db.clearAndLoad('sleepEntries', data.records.sleepEntries),
      db.clearAndLoad('waterEntries', data.records.waterEntries),
      db.clearAndLoad('goals', data.records.goals),
      db.clearAndLoad('milestones', data.records.milestones),
      db.clearAndLoad('challenges', data.records.challenges),
      db.clearAndLoad('challengeEntries', data.records.challengeEntries),
      db.clearAndLoad('progressPhotos', data.records.progressPhotos),
      db.clearAndLoad('journalEntries', data.records.journalEntries),
      db.clearAndLoad('achievements', data.records.achievements),
      db.clearAndLoad('calendarEvents', data.records.calendarEvents),
    ];
    return Promise.all(runs).then(() => undefined);
  },

  clearAndLoad: (store: StoreName, records: any[]): Promise<void> =>
    run(store, 'readwrite', (s) => new Promise<void>((resolve, reject) => {
      const clearReq = s.clear();
      clearReq.onsuccess = () => {
        if (records.length === 0) return resolve();
        let i = 0;
        const next = () => {
          if (i >= records.length) return resolve();
          const putReq = s.add(records[i]);
          putReq.onsuccess = () => { i++; next(); };
          putReq.onerror = () => reject(new DBError(`import load failed on ${store}`, putReq.error));
        };
        next();
      };
      clearReq.onerror = () => reject(new DBError(`clear failed on ${store}`, clearReq.error));
    })),

  // ----- photos blob -----
  putPhotoBlob: (id: string, blob: Blob): Promise<void> =>
    run('progressPhotos', 'readwrite', (store) =>
      new Promise<void>((resolve, reject) => {
        const req = store.put({ id, blob } as any);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(new DBError('putPhotoBlob failed', req.error));
      })),
  getPhotoBlob: (id: string): Promise<Blob | undefined> =>
    run('progressPhotos', 'readonly', (store) =>
      new Promise<Blob | undefined>((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as any)?.blob);
        req.onerror = () => reject(new DBError('getPhotoBlob failed', req.error));
      })),
};

export type WellnessDB = typeof db;

export { DBError };

/**
 * Initialize the database and seed defaults if empty.
 * Safe to call multiple times.
 */
export async function initDB(): Promise<void> {
  await openDB();
  const profile = await db.profile.get();
  if (!profile) {
    await db.profile.save({
      displayName: 'User',
      preferredWeightUnit: 'kg',
      preferredMeasurementUnit: 'cm',
      dateFormat: 'YYYY-MM-DD',
      weekStart: 1,
      currency: 'USD',
      dailyWaterTargetMl: 2000,
      demoMode: false,
      onboardingCompleted: false,
    });
  }
  const settings = await db.settings.get();
  if (!settings) {
    await db.settings.save({
      preferredDashboardMetrics: ['weight', 'calories', 'water', 'workouts', 'habits'],
      customFoodCategories: [],
      customWorkoutCategories: [],
      customHabits: [],
      notificationsEnabled: true,
      reducedMotion: false,
    });
  }
}

export { STORES };
