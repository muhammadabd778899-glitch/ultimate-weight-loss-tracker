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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Meal Planner</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft size={16} strokeWidth={2} /></Button>
          <span className="text-sm font-medium text-dark">{formatWeekRange(weekStart)}</span>
          <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight size={16} strokeWidth={2} /></Button>
          <Button onClick={() => setAddOpen(true)} size="sm"><Plus size={16} strokeWidth={2} /> Plan</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Planning</CardTitle>
          <CardDescription>{completion()}% of meal slots filled this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={completion()} />
        </CardContent>
      </Card>

      {/* Weekly grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-secondary uppercase">Time</span>
          {MEAL_CATEGORIES.map((c) => (
            <span key={c.value} className="text-[10px] text-secondary uppercase">{c.label.slice(0, 3)}</span>
          ))}
        </div>
        {weekDays.map((day) => (
          <div key={day.date} className="flex flex-col gap-1 border border-border rounded-lg p-2 bg-surface hover:bg-green-soft/30 transition-colors">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-semibold text-dark">{day.label}</span>
              <span className="text-[10px] text-secondary">{day.date.slice(5)}</span>
              {day.isToday && <span className="text-[9px] bg-green-primary text-white rounded-full px-1.5">Today</span>}
            </div>
            {MEAL_CATEGORIES.map((cat) => (
              <div
                key={cat.value}
                className="flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors hover:bg-green-soft/50"
                onClick={() => {
                  setPlanForm({ ...planForm, date: day.date, mealCategory: cat.value });
                  setAddOpen(true);
                }}
              >
                <div className="flex-1 min-w-0">
                  {dayPlans(day.date, cat.value).map((p) => (
                    <div key={p.id} className="text-[10px] leading-tight mb-0.5 truncate">
                      {p.type === 'recipe' ? p.recipeName : p.customName}
                      <span className="text-[9px] text-secondary block">{Math.round(p.calories || 0)} cal</span>
                    </div>
                  ))}
                  {dayPlans(day.date, cat.value).length === 0 && <span className="text-[9px] text-secondary/50 italic">—</span>}
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); removePlan(dayPlans(day.date, cat.value)[0]?.id || ''); }} disabled={!dayPlans(day.date, cat.value).length}>
                  <Trash2 size={12} strokeWidth={2} />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between p-1.5">
              <Button variant="outline" size="sm" onClick={() => duplicateDay(day.date, addDaysStr(day.date, 7))}>
                <Copy size={12} strokeWidth={2} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-2">
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
  return `${formatShort(weekStart)} – ${`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`}`;
}
