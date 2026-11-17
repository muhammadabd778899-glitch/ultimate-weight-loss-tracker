/**
 * Workouts — strength and cardio session logging with stats.
 */

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { workoutStats, weeklyWorkoutActivity } from '../services/calculations';
import { Plus, Trash2, Edit2, Activity } from 'lucide-react';
import { success, error } from '../services/toast';
import { today } from '../types';

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'walking', label: 'Walking' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'home', label: 'Home Workout' },
  { value: 'other', label: 'Other' },
];

const INTENSITIES = ['low', 'moderate', 'high'] as const;

export function Workouts() {
  const [sessions, setSessions] = React.useState<any[]>([]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [workoutForm, setWorkoutForm] = React.useState({
    date: today(), name: '', category: 'strength', durationMin: '',
    distanceKm: '', intensity: 'moderate', notes: '', estimatedCalories: '',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [s] = await Promise.all([db.workouts.list()]);
      if (!mounted) return;
      setSessions(s);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const stats = workoutStats(sessions);
  const weekActivity = weeklyWorkoutActivity(sessions, today());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record: any = {
        date: workoutForm.date,
        name: workoutForm.name,
        category: workoutForm.category,
        durationMin: parseInt(workoutForm.durationMin) || 0,
        intensity: workoutForm.intensity,
        notes: workoutForm.notes || undefined,
        estimatedCalories: workoutForm.estimatedCalories ? parseFloat(workoutForm.estimatedCalories) : undefined,
      };
      if (workoutForm.distanceKm) record.distanceKm = parseFloat(workoutForm.distanceKm);
      if (editId) {
        await db.workouts.update(editId, record);
        success('Workout updated');
      } else {
        await db.workouts.add(record);
        success('Workout logged');
      }
      setAddOpen(false);
      setEditId(null);
      setWorkoutForm({ date: today(), name: '', category: 'strength', durationMin: '', distanceKm: '', intensity: 'moderate', notes: '', estimatedCalories: '' });
      const s = await db.workouts.list();
      setSessions(s);
    } catch (err) {
      error('Failed to save workout', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteWorkout = async (id: string) => {
    if (!window.confirm('Delete this workout session?')) return;
    await db.workouts.remove(id);
    await db.workoutExercises.removeByWorkout(id);
    const s = await db.workouts.list();
    setSessions(s);
    success('Deleted');
  };

  const loadForEdit = async (id: string) => {
    const s = await db.workouts.get(id);
    if (!s) return;
    setEditId(s.id);
    setWorkoutForm({
      date: s.date, name: s.name, category: s.category, durationMin: s.durationMin.toString(),
      distanceKm: s.distanceKm?.toString() || '', intensity: s.intensity, notes: s.notes || '',
      estimatedCalories: s.estimatedCalories?.toString() || '',
    });
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Workouts</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Log Workout
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSmall title="Total Sessions" value={stats.count} sub="All time" />
        <StatCardSmall title="Total Minutes" value={stats.totalMinutes} sub="Time invested" />
        <StatCardSmall title="Avg Duration" value={stats.avgDuration} sub="Minutes per session" />
        <StatCardSmall title="Top Category" value={stats.mostFrequentCategory} sub={String(stats.categoryCount[stats.mostFrequentCategory] || 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Minutes per day (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {sessions.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
                    <XAxis dataKey="date" stroke="#718078" fontSize={10} />
                    <YAxis stroke="#718078" fontSize={10} width={40} />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#2E9D59" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">
                  <Activity size={32} strokeWidth={1} className="mb-2 opacity-30" />
                  <p>No workouts yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Sessions by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {sessions.length && Object.entries(stats.categoryCount).length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.categoryCount).map(([cat, count]) => ({ name: cat.charAt(0).toUpperCase() + cat.slice(1), value: count }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%" outerRadius={90}
                    >
                      {['#2E9D59', '#176B3A', '#A8DDB5', '#E7BB59', '#319B61'].map((c, i) => (
                        <Cell key={`c-${i}`} fill={c} />
                      ))}
                      <Tooltip />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">
                  <p>No category data yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Workout History ({sessions.length})</CardTitle>
          <CardDescription>Estimated calories are labelled as estimates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.length ? (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-green-soft/50">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark font-medium">{s.name}</span>
                      <span className="text-[10px] text-secondary border border-border/50 rounded px-1.5">{s.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-secondary">
                      <span>{s.date}</span>
                      <span>· {s.durationMin} min</span>
                      <span>· {s.intensity}</span>
                      {s.distanceKm && <span>· {s.distanceKm} km</span>}
                      {s.estimatedCalories && <span>· ~{Math.round(s.estimatedCalories)} cal*</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => loadForEdit(s.id)} title="Edit">
                      <Edit2 size={16} strokeWidth={2} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteWorkout(s.id)} title="Delete">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-secondary text-center py-6">No workouts logged yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Edit Workout' : 'Log Workout'} description="Record your session. Calorie burn is an estimate.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Date" type="date" value={workoutForm.date} onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })} />
            <Input label="Workout name" value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })} placeholder="e.g. Morning Run" />
            <Select value={workoutForm.category} options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => setWorkoutForm({ ...workoutForm, category: v })} label="Category" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input type="number" value={workoutForm.durationMin} onChange={(e) => setWorkoutForm({ ...workoutForm, durationMin: e.target.value })} placeholder="Duration (min)" />
              <Input type="number" value={workoutForm.distanceKm} onChange={(e) => setWorkoutForm({ ...workoutForm, distanceKm: e.target.value })} placeholder="Distance (km)" />
              <Select value={workoutForm.intensity} options={INTENSITIES.map((i) => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) }))} onChange={(v) => setWorkoutForm({ ...workoutForm, intensity: v })} label="Intensity" />
            </div>
            <Input type="number" value={workoutForm.estimatedCalories} onChange={(e) => setWorkoutForm({ ...workoutForm, estimatedCalories: e.target.value })} placeholder="Est. calories (optional)" />
            <Input label="Notes (optional)" value={workoutForm.notes} onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Save Workout' : 'Log Workout'}</Button>
            </div>
          </form>
        </Modal>
      )}

      <p className="text-[11px] text-secondary">* Estimated calorie burn is an estimate, not an exact measurement.</p>
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
