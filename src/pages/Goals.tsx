/**
 * Goals & Challenges — user-defined goals with progress and milestones.
 */

import * as React from 'react';
import { Card, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/Progress';
import { db } from '../db';
import { goalProgressPct } from '../services/calculations';
import { today, type Goal } from '../types';
import { Plus, Flame, Trash2, ArrowUpRight } from 'lucide-react';
import { success, error } from '../services/toast';

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'weight', label: 'Weight' },
  { value: 'measurement', label: 'Body Measurement' },
  { value: 'workoutFrequency', label: 'Workout Frequency' },
  { value: 'workoutDuration', label: 'Workout Duration' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'water', label: 'Water' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'steps', label: 'Steps' },
  { value: 'custom', label: 'Custom' },
];

const DIRECTIONS: Array<{ value: string; label: string }> = [
  { value: 'increase', label: 'Increase' },
  { value: 'decrease', label: 'Decrease' },
  { value: 'neutral', label: 'Neutral / Consistency' },
];

export function Goals() {
  const [goals, setGoals] = React.useState<any[]>([]);
  const [milestones, setMilestones] = React.useState<any[]>([]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [goalForm, setGoalForm] = React.useState({
    name: '', category: 'weight', startDate: today(), targetDate: today(),
    startingValue: 0, targetValue: 0, unit: 'kg', currentProgress: 0,
    direction: 'decrease' as string, notes: '',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [g, ms] = await Promise.all([db.goals.list(), db.milestones.list()]);
      if (!mounted) return;
      setGoals(g);
      setMilestones(ms);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        ...goalForm,
        startingValue: Number(goalForm.startingValue),
        targetValue: Number(goalForm.targetValue),
        currentProgress: Number(goalForm.currentProgress),
        category: goalForm.category as Goal['category'],
        direction: goalForm.direction as Goal['direction'],
        status: 'active',
      };
      if (editId) {
        await db.goals.update(editId, record);
        success('Goal updated');
      } else {
        await db.goals.add(record);
        success('Goal created');
      }
      setAddOpen(false);
      setEditId(null);
      setGoalForm({ name: '', category: 'weight', startDate: today(), targetDate: today(), startingValue: 0, targetValue: 0, unit: 'kg', currentProgress: 0, direction: 'decrease', notes: '' });
      const g = await db.goals.list();
      setGoals(g);
    } catch (err) {
      error('Failed to save goal', err instanceof Error ? err.message : String(err));
    }
  };

  const updateProgress = async (id: string, value: number) => {
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    await db.goals.update(id, { currentProgress: value });
    const gs = await db.goals.list();
    setGoals(gs);
    success('Progress updated');
  };

  const deleteGoal = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    await db.goals.remove(id);
    const g = await db.goals.list();
    setGoals(g);
    success('Deleted');
  };

  const addMilestone = async (goalId: string) => {
    const name = window.prompt('Milestone name:');
    if (!name) return;
    const target = window.prompt('Target value:');
    if (!target) return;
    try {
      await db.milestones.add({ goalId, name, targetValue: Number(target) });
      const ms = await db.milestones.list();
      setMilestones(ms);
      success('Milestone added');
    } catch (err) {
      error('Failed', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Goals & Challenges</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Add Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g) => {
          const pct = goalProgressPct(g);
          const ms = milestones.filter((m) => m.goalId === g.id);
          const achieved = ms.filter((m) => m.achievedAt).length;
          return (
            <Card key={g.id} padding="md" className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-soft text-green-deep">
                  <Flame size={18} strokeWidth={2} />
                </span>
                <span className="stat-number rounded-full bg-green-soft px-3 py-1 text-[12.5px] font-semibold text-green-deep">{pct}%</span>
              </div>
              <h3 className="mt-3 pr-2 text-[15px] font-semibold leading-snug tracking-tight text-dark">{g.name}</h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
                {categoryLabel(g.category)} · {g.direction}
              </p>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="stat-number text-[24px] font-semibold leading-none text-dark">{formatValue(g.currentProgress)}</span>
                <span className="text-[12.5px] font-medium text-secondary">{g.unit}</span>
                <span className="text-[12.5px] text-secondary">of {formatValue(g.targetValue)} {g.unit}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={pct} height="7px" />
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-secondary">
                  <span>{achieved} / {ms.length} milestones</span>
                  <span>Target {formatGoalDate(g.targetDate)}</span>
                </div>
              </div>

              <CardFooter className="pt-4">
                <Button variant="ghost" size="sm" onClick={() => updateProgress(g.id, Number(window.prompt('New value:', g.currentProgress.toString()) || g.currentProgress))}>
                  <ArrowUpRight size={14} strokeWidth={2} /> Update
                </Button>
                <Button variant="outline" size="sm" onClick={() => addMilestone(g.id)}>+ Milestone</Button>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => deleteGoal(g.id)} aria-label={`Delete ${g.name}`}>
                  <Trash2 size={14} strokeWidth={2} />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <Card padding="lg" className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-soft text-green-deep">
                  <Flame size={22} strokeWidth={1.9} />
                </span>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-dark">Set a goal you control</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-secondary">
                  Choose a target, track progress against it, and add milestones along the way. You set the pace — this app never prescribes aggressive weight loss.
                </p>
              </div>
              <Button onClick={() => setAddOpen(true)} className="shrink-0">
                <Plus size={16} strokeWidth={2} /> Create your first goal
              </Button>
            </div>
          </Card>
        )}
      </div>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Goal" description="Set your own personal goal. Targets are editable and not medical prescriptions.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Goal name" value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} placeholder="e.g. Reach 75 kg" />
            <Select value={goalForm.category} options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => setGoalForm({ ...goalForm, category: v })} label="Category" />
            <Select value={goalForm.direction} options={DIRECTIONS.map((d) => ({ value: d.value, label: d.label }))} onChange={(v) => setGoalForm({ ...goalForm, direction: v })} label="Direction" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Start date" type="date" value={goalForm.startDate} onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })} />
              <Input label="Target date" type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input type="number" value={goalForm.startingValue.toString()} onChange={(e) => setGoalForm({ ...goalForm, startingValue: Number(e.target.value) || 0 })} placeholder="Starting value" />
              <Input type="number" value={goalForm.targetValue.toString()} onChange={(e) => setGoalForm({ ...goalForm, targetValue: Number(e.target.value) || 0 })} placeholder="Target value" />
              <Input value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} placeholder="Unit" />
            </div>
            <Input type="number" value={goalForm.currentProgress.toString()} onChange={(e) => setGoalForm({ ...goalForm, currentProgress: Number(e.target.value) || 0 })} placeholder="Current progress" />
            <Input label="Notes (optional)" value={goalForm.notes} onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })} />
            <div className="text-[12px] text-secondary">You control your targets. This app never prescribes aggressive weight loss.</div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Create Goal</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function formatValue(value: number) {
  const n = Number(value) || 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatGoalDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function categoryLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
