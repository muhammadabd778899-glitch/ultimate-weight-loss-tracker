/**
 * Meal Planner — weekly visual planner assigning recipes/custom meals to days.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/Progress';
import { db } from '../db';
import { Plus, Trash2, Copy, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { success, error } from '../services/toast';
import { today } from '../types';

const MEAL_CATEGORIES: Array<{ value: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string }> = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

export function MealPlanner() {
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [mealPlans, setMealPlans] = React.useState<any[]>([]);
  const [weekStart, setWeekStart] = React.useState(getWeekStart(today()));

  // add/edit modal state
  const [addOpen, setAddOpen] = React.useState(false);
  const [planForm, setPlanForm] = React.useState({
    date: '', mealCategory: 'breakfast', type: 'recipe' as 'recipe' | 'custom',
    recipeId: '', customName: '', quantity: 1, unit: 'servings',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [r, p] = await Promise.all([db.recipes.list(), db.mealPlans.list()]);
      if (!mounted) return;
      setRecipes(r);
      setMealPlans(p);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const weekDays = getWeekDays(weekStart);
  const plansByDay = groupByDay(mealPlans);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record: any = {
        date: planForm.date,
        mealCategory: planForm.mealCategory,
        type: planForm.type,
        quantity: planForm.quantity,
        unit: planForm.unit,
      };
      if (planForm.type === 'recipe') record.recipeId = planForm.recipeId;
      else record.customName = planForm.customName;
      await db.mealPlans.add(record);
      setAddOpen(false);
      setPlanForm({ date: '', mealCategory: 'breakfast', type: 'recipe', recipeId: '', customName: '', quantity: 1, unit: 'servings' });
      const p = await db.mealPlans.list();
      setMealPlans(p);
      success('Meal planned');
    } catch (err) {
      error('Failed to plan meal', err instanceof Error ? err.message : String(err));
    }
  };

  const removePlan = async (id: string) => {
    if (!window.confirm('Remove this planned meal?')) return;
    await db.mealPlans.remove(id);
    const p = await db.mealPlans.list();
    setMealPlans(p);
    success('Removed');
  };

  const duplicateDay = async (fromDate: string, toDate: string) => {
    const plans = await db.mealPlans.list();
    const source = plans.filter((p) => p.date === fromDate);
    try {
      for (const p of source) {
        await db.mealPlans.add({ ...p, date: toDate, id: undefined, createdAt: undefined, updatedAt: undefined } as any);
      }
      const list = await db.mealPlans.list();
      setMealPlans(list);
      success(`Copied ${source.length} meals to ${formatShort(toDate)}`);
    } catch (err) {
      error('Duplicate failed', err instanceof Error ? err.message : String(err));
    }
  };

  const generateGrocery = async () => {
    const weekPlans = mealPlans.filter((p) => p.date >= weekStart && p.date <= weekDays[6].date);
    const recipesMap = new Map(recipes.map((r) => [r.id, r]));
    const ingredients: Record<string, { name: string; qty: number; unit: string }> = {};
    weekPlans.forEach((p) => {
      if (p.type === 'recipe' && p.recipeId) {
        const r = recipesMap.get(p.recipeId);
        if (!r) return;
        const mult = p.quantity || 1;
        r.ingredients.forEach((ing: any) => {
          const key = ing.foodName.toLowerCase();
          if (!ingredients[key]) ingredients[key] = { name: ing.foodName, qty: 0, unit: ing.unit };
          ingredients[key].qty += ing.quantity * mult;
        });
      } else if (p.type === 'custom' && p.customName) {
        const key = p.customName.toLowerCase();
        if (!ingredients[key]) ingredients[key] = { name: p.customName, qty: 0, unit: p.unit };
        ingredients[key].qty += p.quantity || 0;
      }
    });
    const list = Object.values(ingredients);
    try {
      for (const item of list) {
        await db.grocery.add({ name: item.name, category: 'From Meal Plan', quantity: Math.round(item.qty * 10) / 10, unit: item.unit, purchased: false, mealPlanId: undefined });
      }
      success(`Added ${list.length} items to grocery list`);
    } catch (err) {
      error('Grocery generation failed', err instanceof Error ? err.message : String(err));
    }
  };

  const completion = () => {
    const slots = weekDays.length * 4;
    const filled = mealPlans.filter((p) => p.date >= weekStart && p.date <= weekDays[6].date).length;
    return Math.round((filled / slots) * 100);
  };

  const prevWeek = () => setWeekStart(addDaysStr(weekStart, -7));
  const nextWeek = () => setWeekStart(addDaysStr(weekStart, 7));

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Meal Planner</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft size={16} strokeWidth={2} /></Button>
          <span className="text-sm font-medium text-dark">{formatWeekRange(weekStart)}</span>
          <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight size={16} strokeWidth={2} /></Button>
          <Button onClick={() => setAddOpen(true)} size="sm"><Plus size={16} strokeWidth={2} /> Plan</Button>
        </div>
      </div>

      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>This week</CardTitle>
            <CardDescription>{filledSlots()} of {weekDays.length * 4} meal slots filled</CardDescription>
          </div>
          <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">{completion()}% planned</span>
        </CardHeader>
        <CardContent>
          <ProgressBar value={completion()} height="6px" />
          <div className="mt-5 -mx-1 overflow-x-auto pb-1">
            <div className="grid min-w-[900px] grid-cols-7 gap-2.5 px-1">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`flex flex-col rounded-2xl border p-2 ${day.isToday ? 'border-green-mint bg-green-soft/40' : 'border-border/70 bg-[#FBFDFB]'}`}
                >
                  <div className="flex items-start justify-between gap-1 px-0.5 pb-1.5">
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-secondary">{day.label}</p>
                      <p className={`stat-number text-[15px] font-semibold leading-tight ${day.isToday ? 'text-green-deep' : 'text-dark'}`}>{day.date.slice(8)}</p>
                    </div>
                    {day.isToday && <span className="rounded-full bg-green-deep px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-white">Today</span>}
                  </div>

                  <div className="space-y-1">
                    {MEAL_CATEGORIES.map((cat) => {
                      const plans = dayPlans(day.date, cat.value);
                      return (
                        <div key={cat.value} className="rounded-lg border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:bg-white">
                          <button
                            type="button"
                            onClick={() => openSlot(day.date, cat.value)}
                            className="flex w-full items-center justify-between gap-1 text-left"
                          >
                            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-secondary/80">{cat.label}</span>
                            <Plus size={11} strokeWidth={2.2} className="text-secondary/40" />
                          </button>
                          {plans.length ? plans.map((p) => (
                            <div key={p.id} className="mt-1 rounded-md bg-green-soft/80 px-1.5 py-1">
                              <p className="truncate text-[10.5px] font-medium leading-snug text-dark">{p.type === 'recipe' ? p.recipeName : p.customName}</p>
                              <div className="mt-0.5 flex items-center justify-between gap-1">
                                <span className="text-[9px] text-secondary">{Math.round(p.calories || 0)} cal</span>
                                <button type="button" onClick={() => removePlan(p.id)} className="text-secondary/60 transition-colors hover:text-[#C25241]" aria-label="Remove planned meal">
                                  <Trash2 size={10} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          )) : <p className="mt-1 text-[9.5px] italic text-secondary/45">Empty</p>}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => duplicateDay(day.date, addDaysStr(day.date, 7))}
                    className="mt-auto flex items-center justify-center gap-1 rounded-lg pt-2.5 text-[9.5px] font-medium text-secondary transition-colors hover:text-green-deep"
                  >
                    <Copy size={10} strokeWidth={2} /> Copy to next week
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={generateGrocery} size="sm">
          <ShoppingCart size={16} strokeWidth={2} /> Generate Grocery List
        </Button>
      </div>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Plan a Meal" description="Assign a recipe or custom meal to a day and slot.">
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Date" type="date" value={planForm.date} onChange={(e) => setPlanForm({ ...planForm, date: e.target.value })} />
            <Select value={planForm.mealCategory} options={MEAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => setPlanForm({ ...planForm, mealCategory: v as any })} label="Meal slot" />
            <Select value={planForm.type} options={[{ value: 'recipe', label: 'Recipe' }, { value: 'custom', label: 'Custom Meal' }]} onChange={(v) => setPlanForm({ ...planForm, type: v as any })} label="Type" />
            {planForm.type === 'recipe' ? (
              <Select value={planForm.recipeId} options={recipes.map((r) => ({ value: r.id, label: r.name }))} onChange={(v) => setPlanForm({ ...planForm, recipeId: v })} label="Recipe" />
            ) : (
              <Input label="Custom meal name" value={planForm.customName} onChange={(e) => setPlanForm({ ...planForm, customName: e.target.value })} placeholder="e.g. Turkey Sandwich" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="number" value={planForm.quantity.toString()} onChange={(e) => setPlanForm({ ...planForm, quantity: parseFloat(e.target.value) || 1 })} placeholder="Qty" />
              <Input value={planForm.unit} onChange={(e) => setPlanForm({ ...planForm, unit: e.target.value })} placeholder="servings" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add to Plan</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );

  function openSlot(date: string, mealCategory: string) {
    setPlanForm((prev) => ({ ...prev, date, mealCategory }));
    setAddOpen(true);
  }

  function filledSlots() {
    return mealPlans.filter((p) => p.date >= weekStart && p.date <= weekDays[6].date).length;
  }

  function dayPlans(date: string, cat: string) {
    return (plansByDay[date] || [])
      .filter((p) => p.mealCategory === cat)
      .map((p) => {
        let recipeName = p.customName || '';
        let calories = 0;
        if (p.type === 'recipe' && p.recipeId) {
          const r = recipes.find((x) => x.id === p.recipeId);
          if (r) {
            recipeName = r.name;
            calories = r.nutritionPerServing?.calories || 0;
          }
        }
        return { ...p, recipeName, calories };
      });
  }
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

function getWeekDays(weekStart: string) {
  const days = [];
  const d = new Date(weekStart + 'T12:00:00');
  const todayStr = today();
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d);
    cur.setDate(d.getDate() + i);
    days.push({ date: formatDate(cur), label: cur.toLocaleDateString(undefined, { weekday: 'short' }), isToday: formatDate(cur) === todayStr });
  }
  return days;
}

function groupByDay(plans: any[]) {
  const g: Record<string, any[]> = {};
  plans.forEach((p) => {
    if (!g[p.date]) g[p.date] = [];
    g[p.date].push(p);
  });
  return g;
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatWeekRange(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00');
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${formatShort(weekStart)} – ${formatShort(formatDate(end))}, ${end.getFullYear()}`;
}
