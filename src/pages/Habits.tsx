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
import { Plus, CheckCircle2, Activity, Moon, Droplet, Flame } from 'lucide-react';
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
  const archived = habits.filter((h) => h.isArchived);
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
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Habits</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Add Habit
        </Button>
      </div>

      {active.length === 0 ? (
        <Card padding="lg" className="overflow-hidden">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-soft text-green-deep">
                <Activity size={22} strokeWidth={1.9} />
              </span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-dark">Build momentum with small daily habits</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-secondary">
                Track water, movement, sleep or anything you choose. Multiple check-ins in one day count as a single streak day, and missing a day never erases your history.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="shrink-0">
              <Plus size={16} strokeWidth={2} /> Create your first habit
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {active.map((h) => {
            const p = progress.find((x) => x.id === h.id);
            const done = isCompletedToday(h.id);
            return (
              <Card
                key={h.id}
                interactive
                padding="md"
                className={done ? 'border-green-mint/70 bg-[#F6FCF8]' : undefined}
                onClick={() => toggleHabit(h.id, today(), done)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${done ? 'bg-green-deep text-white' : 'bg-green-soft text-green-deep'}`}
                    >
                      {done ? <CheckCircle2 size={19} strokeWidth={2.2} /> : <span className="h-4 w-4 rounded-full border-2 border-current" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-dark">{h.name}</p>
                      <p className="mt-0.5 text-[11.5px] capitalize text-secondary">{h.category}</p>
                    </div>
                  </div>
                  <span className="stat-number shrink-0 text-[15px] font-semibold text-green-deep">{p?.pct ?? 0}%</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={p?.pct ?? 0} height="7px" />
                  <div className="mt-3 flex items-center justify-between text-[11.5px] text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <Flame size={12} strokeWidth={2} />
                      {p?.streak ?? 0} day streak
                    </span>
                    <span>{p?.completed ?? 0}/7 this week</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(active.length > 0 || archived.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Habit list with weekly calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Your habits</CardTitle>
                <CardDescription>Last 7 days · tap a day to toggle it</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {active.map((h) => {
                  const p = progress.find((x) => x.id === h.id);
                  const weekDays = getLast7Days();
                  return (
                    <div key={h.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: h.color }} />
                          <span className="truncate text-[13.5px] font-medium text-dark">{h.name}</span>
                          <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10.5px] capitalize text-secondary">{h.category}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[12px] text-secondary">
                          <span>{p?.pct ?? 0}% this week</span>
                          <span>·</span>
                          <span>{p?.streak ?? 0} day streak</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {weekDays.map((d) => {
                          const e = habitEntries.find((x) => x.habitId === h.id && x.date === d);
                          return (
                            <button
                              key={d}
                              onClick={() => toggleHabit(h.id, d, !!e?.completed)}
                              aria-label={`${h.name} on ${d}`}
                              title={new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              className={`grid h-7 w-7 place-items-center rounded-full border transition-colors ${e?.completed ? 'border-green-deep bg-green-deep text-white' : 'border-border bg-white text-transparent hover:border-green-mint hover:bg-green-soft/60'}`}
                            >
                              <CheckCircle2 size={13} strokeWidth={2.4} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {active.length === 0 && <p className="py-6 text-center text-[12.5px] text-secondary">No active habits. Restore one from the panel beside this card.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Archive / manage */}
          <Card className="lg:col-span-1 self-start">
            <CardHeader>
              <div>
                <CardTitle>Archived</CardTitle>
                <CardDescription>Restore or delete old habits</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {archived.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-[#FBFDFB] p-2.5">
                    <span className="truncate text-[12.5px] text-secondary line-through">{h.name}</span>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" onClick={() => db.habits.update(h.id, { isArchived: false }).then(() => db.habits.list()).then((hh) => setHabits(hh))}>Restore</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteHabit(h.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
                {archived.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-[#FBFDFB] px-3 py-6 text-center text-[12.5px] text-secondary">
                    Nothing archived yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <div className="text-[12px] text-secondary">Missing a day won't reset your streak or history.</div>
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
