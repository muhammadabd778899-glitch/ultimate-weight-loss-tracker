/**
 * Habits — flexible daily habit tracking with streaks.
 * Multiple completions on one day count as one streak day. Missed days never delete progress.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/Progress';
import { db } from '../db';
import { allHabitsCompletion } from '../services/calculations';
import { today, addDays, type Habit } from '../types';
import { Plus, CheckCircle2, Activity, Moon, Droplet } from 'lucide-react';
import { success, error } from '../services/toast';

const HABIT_CATEGORIES: Array<{ value: string; label: string; icon: React.ElementType }> = [
  { value: 'water', label: 'Water', icon: Droplet },
  { value: 'sleep', label: 'Sleep', icon: Moon },
  { value: 'steps', label: 'Steps', icon: Activity },
  { value: 'walking', label: 'Walking', icon: Activity },
  { value: 'meditation', label: 'Meditation', icon: Activity },
  { value: 'stretching', label: 'Stretching', icon: Activity },
  { value: 'exercise', label: 'Exercise', icon: Activity },
  { value: 'fruitVeg', label: 'Fruit & Veg', icon: Activity },
  { value: 'custom', label: 'Custom', icon: Activity },
];

export function Habits() {
  const [habits, setHabits] = React.useState<any[]>([]);
  const [habitEntries, setHabitEntries] = React.useState<any[]>([]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [habitForm, setHabitForm] = React.useState({
    name: '', category: 'custom', color: '#2E9D59', targetPerDay: 1,
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [h, he] = await Promise.all([db.habits.list(), db.habitEntries.list()]);
      if (!mounted) return;
      setHabits(h);
      setHabitEntries(he);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const active = habits.filter((h) => !h.isArchived);
  const progress = allHabitsCompletion(habits, habitEntries, 7);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> = {
        ...habitForm,
        targetPerDay: Number(habitForm.targetPerDay),
        category: habitForm.category as Habit['category'],
        isBuiltIn: habitForm.category === 'water' || habitForm.category === 'sleep' || habitForm.category === 'steps' || habitForm.category === 'walking' || habitForm.category === 'meditation' || habitForm.category === 'stretching' || habitForm.category === 'exercise' || habitForm.category === 'fruitVeg',
        isArchived: false,
      };
      if (editId) {
        await db.habits.update(editId, record);
        success('Habit updated');
      } else {
        await db.habits.add(record);
        success('Habit created');
      }
      setAddOpen(false);
      setEditId(null);
      setHabitForm({ name: '', category: 'custom', color: '#2E9D59', targetPerDay: 1 });
      const h = await db.habits.list();
      setHabits(h);
    } catch (err) {
      error('Failed to save habit', err instanceof Error ? err.message : String(err));
    }
  };

  const toggleHabit = async (habitId: string, date: string, currentlyCompleted: boolean) => {
    await db.habitEntries.upsertDaily(habitId, date, !currentlyCompleted, 1, '');
    const he = await db.habitEntries.list();
    setHabitEntries(he);
  };

  const deleteHabit = async (id: string) => {
    if (!window.confirm('Delete this habit and its history?')) return;
    await db.habits.remove(id);
    const h = await db.habits.list();
    setHabits(h);
    success('Deleted');
  };

  const isCompletedToday = (habitId: string) => !!habitEntries.find((e) => e.habitId === habitId && e.date === today() && e.completed);

  const colors = ['#2E9D59', '#176B3A', '#A8DDB5', '#E7BB59', '#319B61', '#718078'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Habits</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Add Habit
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {active.map((h) => {
          const p = progress.find((x) => x.id === h.id);
          const done = isCompletedToday(h.id);
          return (
            <Card key={h.id} className="cursor-pointer" onClick={() => toggleHabit(h.id, today(), done)}>
              <CardHeader className="pb-2 flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-1">
                    {done ? <CheckCircle2 size={16} strokeWidth={2} fill="white" className="bg-green-deep rounded-full p-0.5" /> : <span className="w-4 h-4 border-2 rounded-full border-current" />}
                    {h.name}
                  </CardTitle>
                  <CardDescription className="text-[10px]">{h.category}</CardDescription>
                </div>
                <span className="text-green-deep font-bold text-sm">{p?.pct ?? 0}%</span>
              </CardHeader>
              <CardContent>
                <ProgressBar value={p?.pct ?? 0} color={h.color} />
                <div className="flex justify-between text-[10px] text-secondary mt-2">
                  <span>Streak: {p?.streak ?? 0} days</span>
                  <span>{p?.completed ?? 0}/7</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {active.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center text-center py-8">
              <Activity size={32} strokeWidth={1} className="mb-2 opacity-40" />
              <p className="text-secondary">No habits yet. Add your first habit.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit list with weekly calendar */}
        <Card lg:col-span-2>
          <CardHeader>
            <CardTitle>Your Habits</CardTitle>
            <CardDescription>Last 7 days · tap to toggle today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {active.map((h) => {
                const p = progress.find((x) => x.id === h.id);
                const weekDays = getLast7Days();
                return (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded-md hover:bg-green-soft/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-dark" style={{ color: h.color }}>{h.name}</span>
                        <span className="text-[10px] text-secondary border border-border/50 rounded px-1.5">{h.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-secondary mt-1">
                        <span>{p?.pct ?? 0}% this week</span>
                        <span>·</span>
                        <span>streak {p?.streak ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {weekDays.map((d) => {
                        const e = habitEntries.find((x) => x.habitId === h.id && x.date === d);
                        return (
                          <button
                            key={d}
                            onClick={() => toggleHabit(h.id, d, !!e?.completed)}
                            className={`w-5 h-5 rounded-full ${e?.completed ? 'bg-green-deep text-white border-green-deep' : 'border border-border text-secondary hover:bg-green-soft/50'}`}
                          >
                            {e?.completed && <CheckCircle2 size={10} strokeWidth={2} fill="white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Archive / manage */}
        <Card lg:col-span-1>
          <CardHeader>
            <CardTitle>Manage</CardTitle>
            <CardDescription>Archive or delete habits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {habits.filter((h) => h.isArchived).map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2 rounded-md bg-attention/20 text-sm">
                  <span className="line-through text-secondary">{h.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => db.habits.update(h.id, { isArchived: false }).then(() => db.habits.list()).then((hh) => setHabits(hh))}>Restore</Button>
                    <Button variant="outline" size="sm" onClick={() => deleteHabit(h.id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {habits.filter((h) => h.isArchived).length === 0 && <p className="text-secondary text-xs text-center">No archived habits.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Habit" description="Create a new habit to track daily.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Habit name" value={habitForm.name} onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })} placeholder="e.g. Morning walk" />
            <Select value={habitForm.category} options={HABIT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => setHabitForm({ ...habitForm, category: v })} label="Category" />
            <Input type="number" value={habitForm.targetPerDay.toString()} onChange={(e) => setHabitForm({ ...habitForm, targetPerDay: Number(e.target.value) || 1 })} placeholder="1" />
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setHabitForm({ ...habitForm, color: c })}
                  className={`w-8 h-8 rounded-full border border-border ${c === habitForm.color ? 'ring-2 ring-green-deep' : ''}`} style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="text-[11px] text-secondary">Missing a day won't reset your streak or history.</div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Create Habit</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );

  function getLast7Days() {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = addDays(now, -i);
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return days;
  }
}
