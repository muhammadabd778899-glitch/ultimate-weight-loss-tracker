/**
 * Grocery List — shopping management with budgets and purchase tracking.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SearchFilter } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { Plus, ShoppingCart, CheckCircle2, Trash2, Edit2, Delete } from 'lucide-react';
import { success, error } from '../services/toast';

export function Grocery() {
  const [items, setItems] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [showPurchased, setShowPurchased] = React.useState(true);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [itemForm, setItemForm] = React.useState({
    name: '', category: 'Produce', quantity: 1, unit: 'pieces',
    estimatedPrice: '', actualPrice: '', purchased: false, notes: '',
  });

  const categories = ['Produce', 'Protein', 'Grains', 'Dairy', 'Pantry', 'Snacks', 'Beverages', 'Household', 'From Meal Plan'];

  useEffect(() => {
    let mounted = true;
    async function load() {
      const i = await db.grocery.list();
      if (!mounted) return;
      setItems(i);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = items.filter((it) => {
    const s = search.toLowerCase();
    const matchSearch = it.name.toLowerCase().includes(s) || (it.category || '').toLowerCase().includes(s);
    const matchCat = categoryFilter ? it.category === categoryFilter : true;
    const matchPurchased = showPurchased || !it.purchased;
    return matchSearch && matchCat && matchPurchased;
  });

  const totalEstimated = filtered.reduce((s, it) => s + (Number(it.estimatedPrice || 0) * it.quantity), 0);
  const totalActual = filtered.reduce((s, it) => s + (Number(it.actualPrice || 0) * it.quantity), 0);
  const purchasedCount = items.filter((it) => it.purchased).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await db.grocery.update(editId, {
          ...itemForm, quantity: Number(itemForm.quantity),
          estimatedPrice: itemForm.estimatedPrice ? Number(itemForm.estimatedPrice) : undefined,
          actualPrice: itemForm.actualPrice ? Number(itemForm.actualPrice) : undefined,
        });
        success('Item updated');
      } else {
        await db.grocery.add({
          ...itemForm, quantity: Number(itemForm.quantity),
          estimatedPrice: itemForm.estimatedPrice ? Number(itemForm.estimatedPrice) : undefined,
          actualPrice: itemForm.actualPrice ? Number(itemForm.actualPrice) : undefined,
        });
        success('Item added');
      }
      setAddOpen(false);
      setEditId(null);
      setItemForm({ name: '', category: 'Produce', quantity: 1, unit: 'pieces', estimatedPrice: '', actualPrice: '', purchased: false, notes: '' });
      const i = await db.grocery.list();
      setItems(i);
    } catch (err) {
      error('Failed to save item', err instanceof Error ? err.message : String(err));
    }
  };

  const togglePurchased = async (id: string, current: boolean) => {
    await db.grocery.setPurchased(id, !current);
    const i = await db.grocery.list();
    setItems(i);
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Remove this item?')) return;
    await db.grocery.remove(id);
    const i = await db.grocery.list();
    setItems(i);
    success('Removed');
  };

  const clearCompleted = async () => {
    if (!window.confirm('Remove all purchased items?')) return;
    const toDelete = items.filter((it) => it.purchased);
    for (const it of toDelete) await db.grocery.remove(it.id);
    const i = await db.grocery.list();
    setItems(i);
    success(`Cleared ${toDelete.length} items`);
  };

  const loadForEdit = async (id: string) => {
    const it = await db.grocery.get(id);
    if (!it) return;
    setEditId(it.id);
    setItemForm({ ...it, quantity: it.quantity, estimatedPrice: it.estimatedPrice?.toString() || '', actualPrice: it.actualPrice?.toString() || '', notes: it.notes || '' });
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Grocery List</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearCompleted} disabled={purchasedCount === 0} size="sm">
            <Delete size={16} strokeWidth={2} /> Clear Purchased ({purchasedCount})
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus size={16} strokeWidth={2} /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardSmall title="Estimated" value={`$${totalEstimated.toFixed(2)}`} sub="Total" />
        <StatCardSmall title="Actual Spent" value={`$${totalActual.toFixed(2)}`} sub="Purchased" />
        <StatCardSmall title="Items" value={filtered.length} sub={showPurchased ? 'shown' : 'pending'} />
        <StatCardSmall title="Purchased" value={purchasedCount} sub="checked off" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchFilter onSearch={setSearch} placeholder="Search items..." />
        </div>
        <div className="w-full md:w-72">
          <Select
            value={categoryFilter}
            options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            onChange={setCategoryFilter}
            label="Category"
            placeholder="All"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showPurchased} onChange={(e) => setShowPurchased(e.target.checked)} />
            Show purchased
          </label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items ({filtered.length})</CardTitle>
          <CardDescription>Check items off as you shop.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.length ? (
              filtered.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-surface hover:bg-green-soft/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => togglePurchased(it.id, it.purchased)}
                      className={`rounded-full border-2 p-1.5 transition-all ${it.purchased ? 'border-green-deep bg-green-deep' : 'border-border'}`}
                    >
                      {it.purchased ? <CheckCircle2 size={16} strokeWidth={2} fill="white" /> : <span className="w-4 h-4 border-2 rounded-full border-current" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${it.purchased ? 'line-through text-secondary' : 'text-dark font-medium'}`}>{it.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-secondary">
                        <span>{it.category}</span>
                        <span>· {it.quantity} {it.unit}</span>
                        {it.estimatedPrice && <span>· est. ${Number(it.estimatedPrice).toFixed(2)}</span>}
                      </div>
                      {it.notes && <div className="text-[11px] text-secondary mt-0.5">{it.notes}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadForEdit(it.id); }} title="Edit">
                      <Edit2 size={16} strokeWidth={2} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); deleteItem(it.id); }} title="Delete">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-secondary text-center py-8">
                <ShoppingCart size={32} strokeWidth={1} className="mb-2 opacity-40" />
                <p>No grocery items yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Edit Item' : 'Add Item'} description="Add a grocery item to your list.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Item name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            <Select value={itemForm.category} options={categories.map((c) => ({ value: c, label: c }))} onChange={(v) => setItemForm({ ...itemForm, category: v })} label="Category" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input type="number" value={String(itemForm.quantity)} onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) || 0 })} placeholder="Qty" />
              <Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="Unit" />
              <Input type="number" value={itemForm.estimatedPrice} onChange={(e) => setItemForm({ ...itemForm, estimatedPrice: e.target.value })} placeholder="Est. price" />
              <Input type="number" value={itemForm.actualPrice} onChange={(e) => setItemForm({ ...itemForm, actualPrice: e.target.value })} placeholder="Actual" />
            </div>
            <Input label="Notes (optional)" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Save Item' : 'Add Item'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCardSmall({ title, value, sub }: { title: string; value: string | number; sub: string }) {
  return (
    <Card className="h-24 flex flex-col justify-between p-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-secondary">{title}</p>
        <p className="text-deep-green font-bold text-lg">{value}</p>
      </div>
      <p className="text-[10px] text-secondary">{sub}</p>
    </Card>
  );
}
