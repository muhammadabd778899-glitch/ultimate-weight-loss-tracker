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

const CATEGORY_COLORS = ['#169C5C', '#0A6B3E', '#7BD3A0', '#D8A84E', '#5E7367', '#319B61'];

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
  const catEntries = Object.entries(stats.categoryCount as Record<string, number>).sort((a, b) => b[1] - a[1]);
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
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Workouts</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Log Workout
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCardSmall title="Total sessions" value={stats.count} sub="All time" />
        <StatCardSmall title="Total minutes" value={Math.round(stats.totalMinutes)} sub="Time invested" />
        <StatCardSmall title="Avg duration" value={`${Math.round(stats.avgDuration)} min`} sub="Minutes per session" />
        <StatCardSmall title="Top category" value={capitalize(stats.mostFrequentCategory)} sub={`${stats.categoryCount[stats.mostFrequentCategory] || 0} sessions`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Weekly activity</CardTitle>
              <CardDescription>Minutes per day · last 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {sessions.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekActivity.map((d) => ({ label: weekdayLabel(d.date), minutes: Math.round(d.minutes) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="workoutBarFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1EAE68" />
                        <stop offset="100%" stopColor="#169C5C" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={8} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={36} />
                    <Tooltip cursor={{ fill: 'rgba(22,156,92,0.06)' }} content={<ChartTip format={(v: number) => `${v} min`} />} />
                    <Bar dataKey="minutes" fill="url(#workoutBarFill)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart icon={Activity} title="No workouts yet" description="Log a session to see your weekly activity." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Category breakdown</CardTitle>
              <CardDescription>Sessions by type</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {sessions.length && catEntries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catEntries.map(([cat, count]) => ({ name: capitalize(cat), value: count }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {catEntries.map(([cat], i) => (
                        <Cell key={cat} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip format={(v: number) => `${v} ${v === 1 ? 'session' : 'sessions'}`} />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart icon={Activity} title="No category data yet" description="Your workout mix will appear here." />
              )}
            </div>
            {catEntries.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5">
                {catEntries.map(([cat, count], i) => (
                  <div key={cat} className="flex items-center justify-between gap-2 text-[11.5px]">
                    <span className="flex min-w-0 items-center gap-1.5 text-secondary">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="truncate capitalize">{cat}</span>
                    </span>
                    <span className="stat-number shrink-0 font-semibold text-dark">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Workout history</CardTitle>
            <CardDescription>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} · calorie burn is an estimate</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {sessions.length ? (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium text-dark">{s.name}</p>
                      <span className="shrink-0 rounded-full border border-border/70 bg-white px-2 py-0.5 text-[10.5px] font-medium capitalize text-secondary">{s.category}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-secondary">
                      <span>{formatShortDate(s.date)}</span>
                      <span>· {Math.round(s.durationMin)} min</span>
                      <span className="capitalize">· {s.intensity}</span>
                      {s.distanceKm ? <span>· {Number(s.distanceKm).toFixed(1)} km</span> : null}
                      {s.estimatedCalories ? <span>· ~{Math.round(s.estimatedCalories)} cal*</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => loadForEdit(s.id)} title="Edit">
                      <Edit2 size={15} strokeWidth={2} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteWorkout(s.id)} title="Delete">
                      <Trash2 size={15} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-[12.5px] text-secondary">No workouts logged yet.</p>
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

      <p className="text-[12px] text-secondary">* Estimated calorie burn is an estimate, not an exact measurement.</p>
    </div>
  );
}

function StatCardSmall({ title, value, sub }: { title: string; value: string | number; sub: string }) {
  return (
    <Card padding="none" className="flex min-h-[112px] flex-col justify-between p-5">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-secondary">{title}</p>
        <p className="stat-number mt-2 text-2xl font-semibold leading-none text-dark">{value}</p>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-secondary">{sub}</p>
    </Card>
  );
}

function EmptyChart({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#FBFDFB] px-5 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft text-green-deep">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-[13px] font-medium text-dark">{title}</p>
      <p className="mt-1 max-w-[230px] text-[11.5px] leading-relaxed text-secondary">{description}</p>
    </div>
  );
}

function ChartTip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-card">
      {label != null && <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">{label}</p>}
      <p className="mt-1 text-[13px] font-semibold text-dark">{format(payload[0].value)}</p>
    </div>
  );
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function weekdayLabel(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
