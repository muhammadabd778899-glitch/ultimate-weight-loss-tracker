/**
 * Meals & Recipes — personal recipe manager with nutrition calculation.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { SearchFilter } from '../components/ui/Select';
import { Plus, BookOpen, Trash2, Star, Copy } from 'lucide-react';
import { success, error } from '../services/toast';
import { type Recipe } from '../types';

export function MealsRecipes() {
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [viewId, setViewId] = React.useState<string | null>(null);

  const [recipeForm, setRecipeForm] = React.useState({
    name: '', description: '', category: 'breakfast', servings: 1,
    prepTimeMin: '', cookTimeMin: '', instructions: '', notes: '', isFavorite: false,
    ingredients: [{ id: '', foodName: '', quantity: 1, unit: 'serving', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }],
  });

  const categories = Array.from(new Set(recipes.map((r) => r.category)));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const r = await db.recipes.list();
      if (!mounted) return;
      setRecipes(r);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = recipes.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = r.name.toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s);
    const matchCat = categoryFilter ? r.category === categoryFilter : true;
    return matchSearch && matchCat;
  });

  const nutritionTotals = (ingredients: any[]) =>
    ingredients.reduce(
      (acc: any, i: any) => ({
        calories: acc.calories + i.calories,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat,
        fiber: acc.fiber + i.fiber,
        sugar: acc.sugar + i.sugar,
        sodium: acc.sodium + i.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const servings = recipeForm.servings || 1;
    const totals = nutritionTotals(recipeForm.ingredients);
    const perServing: any = {};
    for (const k of Object.keys(totals) as (keyof typeof totals)[]) {
      perServing[k] = Math.round((totals[k] / servings) * 10) / 10;
    }
    try {
      const record: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        ...recipeForm,
        servings,
        prepTimeMin: recipeForm.prepTimeMin ? Number(recipeForm.prepTimeMin) : undefined,
        cookTimeMin: recipeForm.cookTimeMin ? Number(recipeForm.cookTimeMin) : undefined,
        nutritionPerServing: perServing as Recipe['nutritionPerServing'],
      };
      if (editId) {
        await db.recipes.update(editId, record);
        success('Recipe updated');
      } else {
        await db.recipes.add(record);
        success('Recipe added');
      }
      setAddOpen(false);
      setEditId(null);
      setRecipeForm({
        name: '', description: '', category: 'breakfast', servings: 1,
        prepTimeMin: '', cookTimeMin: '', instructions: '', notes: '', isFavorite: false,
        ingredients: [{ id: '', foodName: '', quantity: 1, unit: 'serving', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }],
      });
      const r = await db.recipes.list();
      setRecipes(r);
    } catch (err) {
      error('Failed to save recipe', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!window.confirm('Delete this recipe?')) return;
    await db.recipes.remove(id);
    const r = await db.recipes.list();
    setRecipes(r);
    success('Deleted');
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await db.recipes.update(id, { isFavorite: !current });
    const r = await db.recipes.list();
    setRecipes(r);
  };

  const duplicate = async (id: string) => {
    const r = await db.recipes.get(id);
    if (!r) return;
    try {
      const copy: any = { ...r };
      delete copy.id;
      copy.name = `${r.name} (Copy)`;
      delete copy.createdAt;
      delete copy.updatedAt;
      await db.recipes.add(copy);
      const list = await db.recipes.list();
      setRecipes(list);
      success('Duplicated');
    } catch (err) {
      error('Duplicate failed', err instanceof Error ? err.message : String(err));
    }
  };

  const addIngredient = () => {
    setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { id: '', foodName: '', quantity: 1, unit: 'serving', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }] });
  };

  const removeIngredient = (index: number) => {
    if (recipeForm.ingredients.length <= 1) return;
    setRecipeForm({ ...recipeForm, ingredients: recipeForm.ingredients.filter((_, i) => i !== index) });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const ing = [...recipeForm.ingredients];
    ing[index] = { ...ing[index], [field]: value };
    setRecipeForm({ ...recipeForm, ingredients: ing });
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Meals & Recipes</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Add Recipe
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <SearchFilter onSearch={setSearch} placeholder="Search recipes..." />
        </div>
        <div className="w-full md:w-64">
          <Select
            value={categoryFilter}
            options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            onChange={setCategoryFilter}
            label="Category"
            placeholder="All categories"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Recipes ({filtered.length})</CardTitle>
          <CardDescription>Nutrition calculated from your entered ingredient values.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.length ? (
              filtered.map((r) => {
                const totals = nutritionTotals(r.ingredients);
                const perServing = r.servings ? Math.round(totals.calories / r.servings) : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-4 py-3 transition-colors hover:border-green-mint/60 cursor-pointer" onClick={() => setViewId(r.id)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-dark">{r.name}</span>
                        {r.isFavorite && <Star size={13} strokeWidth={2} fill="#E7BB59" className="shrink-0 text-[#E7BB59]" />}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-secondary">
                        <span className="rounded-full border border-border/70 bg-white px-2 py-0.5 text-[10.5px] font-medium capitalize">{r.category}</span>
                        <span>{r.servings} {Number(r.servings) === 1 ? 'serving' : 'servings'}</span>
                        {r.prepTimeMin ? <span>· {r.prepTimeMin} min prep</span> : null}
                        {r.cookTimeMin ? <span>· {r.cookTimeMin} min cook</span> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="hidden text-right sm:block">
                        <p className="stat-number text-[13px] font-semibold text-green-deep">{perServing} <span className="text-[10.5px] font-medium text-secondary">cal/serving</span></p>
                        <p className="mt-0.5 text-[11px] text-secondary">P {totals.protein.toFixed(1)} · C {totals.carbs.toFixed(1)} · F {totals.fat.toFixed(1)} g</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewId(r.id); }} title="View">
                          <BookOpen size={16} strokeWidth={2} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleFavorite(r.id, r.isFavorite); }} title={r.isFavorite ? 'Unfavorite' : 'Favorite'}>
                          <Star size={16} strokeWidth={2} fill={r.isFavorite ? '#E7BB59' : 'none'} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); duplicate(r.id); }} title="Duplicate">
                          <Copy size={16} strokeWidth={2} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); deleteRecipe(r.id); }} title="Delete">
                          <Trash2 size={16} strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-secondary text-center py-8">
                <BookOpen size={32} strokeWidth={1} className="mb-2 opacity-40" />
                <p>No recipes yet. Add your first recipe.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {viewId != null && (
        <Modal open onClose={() => setViewId(null)} title="Recipe Details">
          <ViewRecipeModal recipeId={viewId} onClose={() => setViewId(null)} />
        </Modal>
      )}

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Edit Recipe' : 'Add Recipe'} description="Add ingredients and instructions.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Recipe name" value={recipeForm.name} onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })} />
            <Input label="Category" value={recipeForm.category} onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })} placeholder="breakfast, lunch, dinner, snack" />
            <Textarea label="Description" value={recipeForm.description} onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })} />
            <Input label="Servings" type="number" value={recipeForm.servings.toString()} onChange={(e) => setRecipeForm({ ...recipeForm, servings: parseInt(e.target.value) || 1 })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Prep time (min)" type="number" value={recipeForm.prepTimeMin} onChange={(e) => setRecipeForm({ ...recipeForm, prepTimeMin: e.target.value })} />
              <Input label="Cook time (min)" type="number" value={recipeForm.cookTimeMin} onChange={(e) => setRecipeForm({ ...recipeForm, cookTimeMin: e.target.value })} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-dark">Ingredients</span>
                <Button variant="outline" size="sm" onClick={addIngredient}>+ Add ingredient</Button>
              </div>
              {recipeForm.ingredients.map((ing: any, i: number) => (
                <div key={ing.id || i} className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-end">
                  <Input value={ing.foodName} onChange={(e) => updateIngredient(i, 'foodName', e.target.value)} placeholder="Food name" />
                  <Input type="number" value={ing.quantity.toString()} onChange={(e) => updateIngredient(i, 'quantity', parseFloat(e.target.value) || 0)} placeholder="Qty" className="w-20" />
                  <Input value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} placeholder="Unit" className="w-32" />
                  <Input type="number" value={ing.calories.toString()} onChange={(e) => updateIngredient(i, 'calories', parseFloat(e.target.value) || 0)} placeholder="Cal" className="w-20" />
                  <Input type="number" value={ing.protein.toString()} onChange={(e) => updateIngredient(i, 'protein', parseFloat(e.target.value) || 0)} placeholder="P" className="w-16" />
                  <Input type="number" value={ing.carbs.toString()} onChange={(e) => updateIngredient(i, 'carbs', parseFloat(e.target.value) || 0)} placeholder="C" className="w-16" />
                  <Input type="number" value={ing.fat.toString()} onChange={(e) => updateIngredient(i, 'fat', parseFloat(e.target.value) || 0)} placeholder="F" className="w-16" />
                  <Button variant="outline" size="sm" onClick={() => removeIngredient(i)}>
                    <Trash2 size={14} strokeWidth={2} />
                  </Button>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2 text-[12px] text-secondary">
                <span>Cal</span><span>P</span><span>C</span><span>F</span>
              </div>
            </div>
            <Textarea label="Instructions" value={recipeForm.instructions} onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })} rows={3} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={recipeForm.isFavorite} onChange={(e) => setRecipeForm({ ...recipeForm, isFavorite: e.target.checked })} />
              Mark as favorite
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Save Recipe' : 'Add Recipe'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ViewRecipeModal({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const [recipe, setRecipe] = React.useState<any>(null);
  const [servingMultiplier, setServingMultiplier] = React.useState(1);

  React.useEffect(() => {
    let mounted = true;
    db.recipes.get(recipeId).then((r) => { if (mounted) setRecipe(r); });
    return () => { mounted = false; };
  }, [recipeId]);

  if (!recipe) return React.createElement('div', { className: 'p-4' }, 'Loading...');

  const totals = recipe.ingredients.reduce(
    (acc: any, i: any) => ({
      calories: acc.calories + i.calories * servingMultiplier,
      protein: acc.protein + i.protein * servingMultiplier,
      carbs: acc.carbs + i.carbs * servingMultiplier,
      fat: acc.fat + i.fat * servingMultiplier,
      fiber: acc.fiber + i.fiber * servingMultiplier,
      sugar: acc.sugar + i.sugar * servingMultiplier,
      sodium: acc.sodium + i.sodium * servingMultiplier,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  return (
    <div className="max-w-2xl">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-deep-green font-bold text-xl">{recipe.name}</h2>
            <p className="text-secondary text-sm">{recipe.category} · {recipe.servings} servings</p>
          </div>
          <button className="rounded-full p-1.5 hover:bg-green-soft" onClick={onClose}>
            <CloseButton size={20} strokeWidth={2} />
          </button>
        </div>
        {recipe.description && <p className="text-secondary">{recipe.description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-secondary uppercase tracking-wider">
          <span>Prep</span><span>{recipe.prepTimeMin || '—'} min</span><span>Cook</span><span>{recipe.cookTimeMin || '—'} min</span>
        </div>
        <div className="border border-border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-dark mb-2">Nutrition (servings: {servingMultiplier})</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="block text-deep-green font-bold">{Math.round(totals.calories)}</span><span className="text-secondary text-[11px]">cal</span></div>
            <div><span className="block text-deep-green font-bold">{totals.protein.toFixed(1)}</span><span className="text-secondary text-[11px]">P</span></div>
            <div><span className="block text-deep-green font-bold">{totals.carbs.toFixed(1)}</span><span className="text-secondary text-[11px]">C</span></div>
            <div><span className="block text-deep-green font-bold">{totals.fat.toFixed(1)}</span><span className="text-secondary text-[11px]">F</span></div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-dark">Ingredients</h3>
          <div className="space-y-1">
            {recipe.ingredients.map((ing: any) => (
              <div key={ing.id} className="flex justify-between text-sm text-dark">
                <span>{ing.quantity} {ing.unit} {ing.foodName}</span>
                <span>{ing.calories.toFixed(0)} cal</span>
              </div>
            ))}
          </div>
        </div>
        {recipe.instructions && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-dark">Instructions</h3>
            <p className="text-secondary text-sm">{recipe.instructions}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}>-</Button>
        <Button variant="outline" size="sm" onClick={() => setServingMultiplier(servingMultiplier + 0.5)}>+</Button>
        <span className="text-xs text-secondary">{servingMultiplier}x servings</span>
      </div>
    </div>
  );
}

function CloseButton({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, fill: 'none',
    stroke: 'currentColor', strokeWidth: strokeWidth, viewBox: '0 0 24 24',
    children: React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M6 18L18 6M6 6l12 12' }),
  });
}
