/**
 * Goals & Challenges — user-defined goals with progress and milestones.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Goals & Challenges</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Add Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {goals.map((g) => {
          const pct = goalProgressPct(g);
          const ms = milestones.filter((m) => m.goalId === g.id);
          const achieved = ms.filter((m) => m.achievedAt).length;
          return (
            <Card key={g.id} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{g.name}</CardTitle>
                    <CardDescription className="text-[10px] text-secondary">{g.category} · {g.direction}</CardDescription>
                  </div>
                  <span className="text-green-deep font-bold">{pct}%</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-secondary mt-1">
                  <span>{g.startingValue}{g.unit} → {g.targetValue}{g.unit}</span>
                  <span>· {g.currentProgress}{g.unit} now</span>
                </div>
              </CardHeader>
              <CardContent>
                <ProgressBar value={pct} />
                <div className="flex justify-between text-[10px] text-secondary mt-2">
                  <span>Milestones: {achieved} / {ms.length} achieved</span>
                  <span>Target: {g.targetDate}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => updateProgress(g.id, Number(window.prompt('New value:', g.currentProgress.toString()) || g.currentProgress))}>
                    <ArrowUpRight size={14} strokeWidth={2} /> Update
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addMilestone(g.id)}>+ Milestone</Button>
                  <Button variant="outline" size="sm" onClick={() => deleteGoal(g.id)}>
                    <Trash2 size={14} strokeWidth={2} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center text-center py-8">
              <Flame size={32} strokeWidth={1} className="mb-2 opacity-40" />
              <p className="text-secondary">No goals yet. Set your own personal goal.</p>
            </CardContent>
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
            <div className="text-[11px] text-secondary">You control your targets. This app never prescribes aggressive weight loss.</div>
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
