/**
 * Food Library — reusable personal food database.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { SearchFilter } from '../components/ui/Select';
import { Plus, Trash2, Edit2, Star, Copy, Info } from 'lucide-react';
import { success, error } from '../services/toast';

export function FoodLibrary() {
  const [foods, setFoods] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [foodForm, setFoodForm] = React.useState({
    name: '', category: '', brand: '', servingSize: 100, servingUnit: 'g',
    calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, isFavorite: false, isCustom: true, notes: '',
  });

  const categories = Array.from(new Set(foods.map((f) => f.category)));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const f = await db.food.list();
      if (!mounted) return;
      setFoods(f);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = foods.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || (f.brand || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? f.category === categoryFilter : true;
    return matchSearch && matchCat;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await db.food.update(editId, { ...foodForm, isCustom: true, isFavorite: foodForm.isFavorite });
        success('Food updated');
      } else {
        await db.food.add({ ...foodForm, isCustom: true, isFavorite: foodForm.isFavorite, notes: foodForm.notes || 'Nutrition values are estimates and may vary by brand and preparation. Logged values are not a substitute for professional dietary advice.' });
        success('Food added');
      }
      setAddOpen(false);
      setEditId(null);
      setFoodForm({ name: '', category: '', brand: '', servingSize: 100, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, isFavorite: false, isCustom: true, notes: '' });
      const f = await db.food.list();
      setFoods(f);
    } catch (err) {
      error('Failed to save food', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteFood = async (id: string) => {
    if (!window.confirm('Delete this food from your library?')) return;
    await db.food.remove(id);
    const f = await db.food.list();
    setFoods(f);
    success('Deleted');
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const food = await db.food.get(id);
    if (!food) return;
    await db.food.update(id, { isFavorite: !current });
    const f = await db.food.list();
    setFoods(f);
  };

  const loadForEdit = async (id: string) => {
    const f = await db.food.get(id);
    if (!f) return;
    setEditId(f.id);
    setFoodForm({ name: f.name, category: f.category, brand: f.brand || '', servingSize: f.servingSize, servingUnit: f.servingUnit, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, sugar: f.sugar, sodium: f.sodium, isFavorite: f.isFavorite, isCustom: true, notes: f.notes || '' });
    setAddOpen(true);
  };

  const duplicate = async (id: string) => {
    const f = await db.food.get(id);
    if (!f) return;
    try {
      const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = f;
      await db.food.add({ ...rest, name: `${f.name} (Copy)` });
      const list = await db.food.list();
      setFoods(list);
      success('Duplicated');
    } catch (err) {
      error('Duplicate failed', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Food Library</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Add Food
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchFilter onSearch={setSearch} placeholder="Search foods or brand..." />
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
          <CardTitle>Your Foods ({filtered.length})</CardTitle>
          <CardDescription>Manually entered nutrition information may be incomplete or inaccurate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.length ? (
              filtered.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-green-soft/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-dark font-medium">{f.name}</span>
                      {f.brand && <span className="text-[10px] text-secondary border border-border/50 rounded px-1.5">{f.brand}</span>}
                      {f.isFavorite && <Star size={14} strokeWidth={2} fill="#E7BB59" className="text-yellow-500" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-secondary mt-1">
                      <span>{f.category}</span>
                      <span>· {f.servingSize}{f.servingUnit}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-green-deep font-semibold">{f.calories} cal</span>
                      <span className="text-secondary">{f.protein.toFixed(1)}P</span>
                      <span className="text-secondary">{f.carbs.toFixed(1)}C</span>
                      <span className="text-secondary">{f.fat.toFixed(1)}F</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => loadForEdit(f.id)} title="Edit">
                      <Edit2 size={16} strokeWidth={2} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleFavorite(f.id, f.isFavorite)} title={f.isFavorite ? 'Unfavorite' : 'Favorite'}>
                      <Star size={16} strokeWidth={2} fill={f.isFavorite ? '#E7BB59' : 'none'} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicate(f.id)} title="Duplicate">
                      <Copy size={16} strokeWidth={2} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteFood(f.id)} title="Delete">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-secondary text-center py-8">
                <Info size={24} strokeWidth={1} className="mb-2 opacity-40" />
                <p>No foods found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Edit Food' : 'Add Food'} description="Enter nutrition per serving.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Food name" value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} placeholder="e.g. Chicken Breast" />
            <Input label="Category" value={foodForm.category} onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })} placeholder="e.g. Protein" />
            <Input label="Brand (optional)" value={foodForm.brand} onChange={(e) => setFoodForm({ ...foodForm, brand: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Serving size" type="number" value={foodForm.servingSize.toString()} onChange={(e) => setFoodForm({ ...foodForm, servingSize: parseFloat(e.target.value) || 1 })} placeholder="100" />
              <Input label="Serving unit" value={foodForm.servingUnit} onChange={(e) => setFoodForm({ ...foodForm, servingUnit: e.target.value })} placeholder="g" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Calories" type="number" value={foodForm.calories.toString()} onChange={(e) => setFoodForm({ ...foodForm, calories: parseFloat(e.target.value) || 0 })} />
              <Input label="Protein (g)" type="number" value={foodForm.protein.toString()} onChange={(e) => setFoodForm({ ...foodForm, protein: parseFloat(e.target.value) || 0 })} />
              <Input label="Carbs (g)" type="number" value={foodForm.carbs.toString()} onChange={(e) => setFoodForm({ ...foodForm, carbs: parseFloat(e.target.value) || 0 })} />
              <Input label="Fat (g)" type="number" value={foodForm.fat.toString()} onChange={(e) => setFoodForm({ ...foodForm, fat: parseFloat(e.target.value) || 0 })} />
              <Input label="Fiber (g)" type="number" value={foodForm.fiber.toString()} onChange={(e) => setFoodForm({ ...foodForm, fiber: parseFloat(e.target.value) || 0 })} />
              <Input label="Sugar (g)" type="number" value={foodForm.sugar.toString()} onChange={(e) => setFoodForm({ ...foodForm, sugar: parseFloat(e.target.value) || 0 })} />
              <Input label="Sodium (mg)" type="number" value={foodForm.sodium.toString()} onChange={(e) => setFoodForm({ ...foodForm, sodium: parseFloat(e.target.value) || 0 })} />
            </div>
            <Input label="Notes (optional)" value={foodForm.notes} onChange={(e) => setFoodForm({ ...foodForm, notes: e.target.value })} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={foodForm.isFavorite} onChange={(e) => setFoodForm({ ...foodForm, isFavorite: e.target.checked })} />
              Mark as favorite
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Save Changes' : 'Add Food'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
