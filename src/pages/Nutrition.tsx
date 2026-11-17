/**
 * Nutrition — daily food logging with macro/calorie tracking.
 */

import * as React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ProgressBar, ProgressRing } from '../components/ui/Progress';
import { db } from '../db';
import { dailyTotals, dailyWater } from '../services/calculations';
import { today, type MealEntry } from '../types';
import { Plus, Trash2, Edit2, Copy, Droplet, Flame } from 'lucide-react';
import { success, error } from '../services/toast';

const MEAL_CATEGORIES: Array<{ value: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string }> = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

export function Nutrition() {
  const [date, setDate] = React.useState(today());
  const [profile, setProfile] = React.useState<any>(null);
  const [foods, setFoods] = React.useState<any[]>([]);
  const [mealEntries, setMealEntries] = React.useState<any[]>([]);
  const [waterEntries, setWaterEntries] = React.useState<any[]>([]);

  // modals/forms
  const [addMealOpen, setAddMealOpen] = React.useState(false);
  const [editMealId, setEditMealId] = React.useState<string | null>(null);
  const [waterOpen, setWaterOpen] = React.useState(false);

  const [mealForm, setMealForm] = React.useState({
    mealCategory: 'breakfast',
    foodId: '',
    foodName: '',
    quantity: 1,
    unit: 'serving',
  });

  const [waterForm, setWaterForm] = React.useState({ amount: 250 });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [f, m, w, p] = await Promise.all([
        db.food.list(),
        db.meals.list(),
        db.water.list(),
        db.profile.get(),
      ]);
      if (!mounted) return;
      setFoods(f);
      setMealEntries(m);
      setWaterEntries(w);
      setProfile(p);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const dayMeals = mealEntries.filter((m) => m.date === date);
  const totals = dailyTotals(mealEntries, date);
  const waterToday = dailyWater(waterEntries, date);
  const waterTarget = profile?.dailyWaterTargetMl || 2000;

  // targets from profile (editable)
  const calTarget = 2000; // placeholder default; editable in settings
  const proteinTarget = 120;
  const carbsTarget = 250;
  const fatTarget = 67;

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const food = foods.find((f) => f.id === mealForm.foodId) || { name: mealForm.foodName, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, servingUnit: mealForm.unit, servingSize: 1 };
    const mult = mealForm.quantity / (food.servingSize || 1);
    const record: Omit<MealEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      date,
      mealCategory: mealForm.mealCategory as MealEntry['mealCategory'],
      foodId: mealForm.foodId || undefined,
      foodSnapshot: { name: food.name, category: food.category },
      quantity: mealForm.quantity,
      unit: mealForm.unit,
      calories: Math.round((food.calories || 0) * mult * 10) / 10,
      protein: Math.round((food.protein || 0) * mult * 10) / 10,
      carbs: Math.round((food.carbs || 0) * mult * 10) / 10,
      fat: Math.round((food.fat || 0) * mult * 10) / 10,
      fiber: Math.round((food.fiber || 0) * mult * 10) / 10,
      sugar: Math.round((food.sugar || 0) * mult * 10) / 10,
      sodium: Math.round((food.sodium || 0) * mult * 10) / 10,
    };
    try {
      if (editMealId) {
        await db.meals.update(editMealId, record);
        success('Meal updated');
      } else {
        await db.meals.add(record);
        success('Meal logged');
      }
      setAddMealOpen(false);
      setEditMealId(null);
      setMealForm({ mealCategory: 'breakfast', foodId: '', foodName: '', quantity: 1, unit: 'serving' });
      const m = await db.meals.list();
      setMealEntries(m);
    } catch (err) {
      error('Failed to save meal', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteMeal = async (id: string) => {
    if (!window.confirm('Remove this meal entry?')) return;
    await db.meals.remove(id);
    const m = await db.meals.list();
    setMealEntries(m);
    success('Removed');
  };

  const duplicateMeal = async (id: string) => {
    const entry = mealEntries.find((m) => m.id === id);
    if (!entry) return;
    try {
      await db.meals.add({ ...entry, date, id: undefined, createdAt: undefined, updatedAt: undefined });
      const m = await db.meals.list();
      setMealEntries(m);
      success('Duplicated');
    } catch (err) {
      error('Duplicate failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.water.add({ date: date, amountMl: waterForm.amount, notes: '' });
      setWaterOpen(false);
      setWaterForm({ amount: 250 });
      const w = await db.water.list();
      setWaterEntries(w);
      success('Water logged');
    } catch (err) {
      error('Failed to log water', err instanceof Error ? err.message : String(err));
    }
  };

  const loadMealForEdit = async (id: string) => {
    const entry = await db.meals.get(id);
    if (!entry) return;
    setEditMealId(entry.id);
    setMealForm({
      mealCategory: entry.mealCategory,
      foodId: entry.foodId || '',
      foodName: entry.foodSnapshot?.name || '',
      quantity: entry.quantity,
      unit: entry.unit,
    });
    setAddMealOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Nutrition</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setWaterOpen(true)} size="sm">
            <Droplet size={16} strokeWidth={2} /> Water
          </Button>
          <Button onClick={() => setAddMealOpen(true)} size="sm">
            <Plus size={16} strokeWidth={2} /> Add Food
          </Button>
        </div>
      </div>

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-48"
      />

      {/* Daily totals cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NutritionStat title="Calories" value={Math.round(totals.calories)} target={calTarget} unit="kcal" color="#E7BB59" />
        <NutritionStat title="Protein" value={totals.protein.toFixed(1)} target={proteinTarget} unit="g" color="#2E9D59" />
        <NutritionStat title="Carbs" value={totals.carbs.toFixed(1)} target={carbsTarget} unit="g" color="#A8DDB5" />
        <NutritionStat title="Fat" value={totals.fat.toFixed(1)} target={fatTarget} unit="g" color="#176B3A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macro breakdown */}
        <Card lg:col-span-2>
          <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
            <CardDescription>Share of calories from protein, carbs, fat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {totals.protein + totals.carbs + totals.fat > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Protein', value: totals.protein * 4, color: '#2E9D59' },
                        { name: 'Carbs', value: totals.carbs * 4, color: '#A8DDB5' },
                        { name: 'Fat', value: totals.fat * 9, color: '#176B3A' },
                      ].filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine={false}
                    >
                      {[
                        { fill: '#2E9D59' },
                        { fill: '#A8DDB5' },
                        { fill: '#176B3A' },
                      ].map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                      <Tooltip formatter={(v: number) => `${v} kcal`} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">
                  <Flame size={40} strokeWidth={1} className="mb-2 opacity-30" />
                  <p>No meals logged for {date}.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Water */}
        <Card lg:col-span-1>
          <CardHeader>
            <CardTitle>Water</CardTitle>
            <CardDescription>{Math.round(waterToday)}ml / {waterTarget}ml</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ProgressRing value={Math.min(100, Math.round((waterToday / waterTarget) * 100))} size={64} thickness={8} label={`${Math.round((waterToday / waterTarget) * 100)}%`} />
            <div className="flex-1">
              <p className="text-dark text-sm font-medium">Daily target</p>
              <p className="text-secondary text-xs">{waterTarget / 1000} L · editable in Settings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meals by category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_CATEGORIES.map((cat) => {
          const catMeals = dayMeals.filter((m) => m.mealCategory === cat.value);
          const catCal = catMeals.reduce((s, m) => s + m.calories, 0);
          return (
            <Card key={cat.value}>
              <CardHeader className="flex items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{cat.label}</CardTitle>
                  <CardDescription className="text-[10px]">{Math.round(catCal)} kcal</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setMealForm({ ...mealForm, mealCategory: cat.value }); setAddMealOpen(true); }}>
                  <Plus size={14} strokeWidth={2} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {catMeals.length ? (
                    catMeals.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-md hover:bg-green-soft/50">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-dark">{m.foodSnapshot?.name || m.foodName}</span>
                            <span className="text-green-deep font-semibold">{Math.round(m.calories)} cal</span>
                          </div>
                          <div className="text-[11px] text-secondary">
                            {m.quantity} {m.unit} · {m.protein.toFixed(1)}P / {m.carbs.toFixed(1)}C / {m.fat.toFixed(1)}F
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => loadMealForEdit(m.id)} title="Edit">
                            <Edit2 size={16} strokeWidth={2} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => duplicateMeal(m.id)} title="Duplicate">
                            <Copy size={16} strokeWidth={2} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteMeal(m.id)} title="Delete">
                            <Trash2 size={16} strokeWidth={2} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-secondary text-xs text-center py-4">No {cat.label.toLowerCase()} logged</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add meal modal */}
      {addMealOpen && (
        <Modal open={addMealOpen} onClose={() => setAddMealOpen(false)} title={editMealId ? 'Edit Meal' : 'Add Meal'} description="Choose a food, set quantity, and log it.">
          <form onSubmit={handleMealSubmit} className="space-y-4">
            <Select value={mealForm.mealCategory} options={MEAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => setMealForm({ ...mealForm, mealCategory: v as any })} label="Meal category" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                value={mealForm.foodId}
                options={foods.map((f) => ({ value: f.id, label: f.name }))}
                onChange={(v) => {
                  const f = foods.find((x) => x.id === v);
                  setMealForm({ ...mealForm, foodId: v || '', foodName: f?.name || '', unit: f?.servingUnit || 'serving' });
                }}
                label="Select food"
              />
              <Input
                label="Quantity"
                type="number"
                value={mealForm.quantity.toString()}
                onChange={(e) => setMealForm({ ...mealForm, quantity: parseFloat(e.target.value) || 1 })}
                placeholder="1"
              />
            </div>
            <Input label="Unit" value={mealForm.unit} onChange={(e) => setMealForm({ ...mealForm, unit: e.target.value })} placeholder="serving" />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddMealOpen(false)}>Cancel</Button>
              <Button type="submit">{editMealId ? 'Save Changes' : 'Log Food'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {waterOpen && (
        <Modal open={waterOpen} onClose={() => setWaterOpen(false)} title="Log Water" description="How much did you drink?">
          <form onSubmit={handleWaterSubmit} className="space-y-4">
            <Input label="Amount (ml)" type="number" value={waterForm.amount.toString()} onChange={(e) => setWaterForm({ ...waterForm, amount: parseFloat(e.target.value) || 0 })} placeholder="250" />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setWaterOpen(false)}>Cancel</Button>
              <Button type="submit">Log Water</Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="border-t border-border pt-6">
        <p className="text-[11px] text-secondary">Nutrition values are estimates from your food library and may be incomplete or inaccurate. Not medical advice.</p>
      </div>
    </div>
  );
}

function NutritionStat({ title, value, target, unit, color }: { title: string; value: string | number; target: number; unit: string; color: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <span className="text-[10px] text-secondary uppercase">{unit}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-deep-green font-bold text-2xl">{value}</div>
        <ProgressBar value={Math.min(100, Math.round((Number(value) / target) * 100))} color={color} height="6px" />
        <p className="text-[10px] text-secondary">Target: {target}{unit}</p>
      </CardContent>
    </Card>
  );
}
