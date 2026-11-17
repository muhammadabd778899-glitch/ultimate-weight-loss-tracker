/**
 * Workout Planner — weekly schedule with planned workouts and status tracking.
 */

import * as React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/Progress';
import { db } from '../db';
import { Plus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { success, error } from '../services/toast';
import { today, type WorkoutPlan } from '../types';

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
  { value: 'rest', label: 'Rest Day' },
];

export function WorkoutPlanner() {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [weekStart, setWeekStart] = React.useState(getWeekStart(today()));

  const [addOpen, setAddOpen] = React.useState(false);
  const [planForm, setPlanForm] = React.useState({
    date: '', name: '', category: 'strength', durationMin: 30, status: 'planned', notes: '',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const p = await db.workoutPlans.list();
      if (!mounted) return;
      setPlans(p);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const weekDays = getWeekDays(weekStart);
  const plansByDay: Record<string, any[]> = {};
  plans.forEach((p) => { if (!plansByDay[p.date]) plansByDay[p.date] = []; plansByDay[p.date].push(p); });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.workoutPlans.add({ ...planForm, durationMin: Number(planForm.durationMin), category: planForm.category as WorkoutPlan['category'], status: planForm.status as WorkoutPlan['status'] });
      setAddOpen(false);
      setPlanForm({ date: '', name: '', category: 'strength', durationMin: 30, status: 'planned', notes: '' });
      const p = await db.workoutPlans.list();
      setPlans(p);
      success('Workout planned');
    } catch (err) {
      error('Failed to plan workout', err instanceof Error ? err.message : String(err));
    }
  };

  const updateStatus = async (id: string, status: WorkoutPlan['status']) => {
    await db.workoutPlans.update(id, { status });
    const p = await db.workoutPlans.list();
    setPlans(p);
  };

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));

  const completedCount = plans.filter((p) => p.status === 'completed' && p.date >= weekStart && p.date <= weekDays[6].date).length;
  const totalScheduled = plans.filter((p) => p.date >= weekStart && p.date <= weekDays[6].date).length;

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Workout Planner</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft size={16} strokeWidth={2} /></Button>
          <span className="text-sm font-medium text-dark">{formatWeekRange(weekStart)}</span>
          <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight size={16} strokeWidth={2} /></Button>
          <Button onClick={() => setAddOpen(true)} size="sm"><Plus size={16} strokeWidth={2} /> Plan</Button>
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-dark">This week</p>
            <p className="mt-0.5 text-[12.5px] text-secondary">
              {totalScheduled
                ? `${completedCount} of ${totalScheduled} planned workouts completed`
                : 'No workouts planned yet — add one to any day below.'}
            </p>
          </div>
          <span className="rounded-full bg-green-soft px-2.5 py-1 text-[11px] font-semibold text-green-deep">
            {totalScheduled ? `${Math.round((completedCount / totalScheduled) * 100)}% done` : '0% done'}
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={totalScheduled ? Math.round((completedCount / totalScheduled) * 100) : 0} height="7px" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {weekDays.map((day) => (
          <div
            key={day.date}
            className={`flex min-h-[176px] flex-col rounded-2xl border p-3 transition-colors ${day.isToday ? 'border-green-mint/80 bg-[#F6FCF8]' : 'border-border/70 bg-white'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-secondary">{day.label}</p>
                <p className="stat-number mt-0.5 text-[15px] font-semibold leading-none text-dark">{Number(day.date.slice(8))}</p>
              </div>
              {day.isToday && <span className="rounded-full bg-green-deep px-2 py-0.5 text-[9.5px] font-semibold text-white">Today</span>}
            </div>
            <div className="mt-2.5 flex-1 space-y-1.5">
              {dayPlans(day.date).length ? (
                dayPlans(day.date).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateStatus(p.id, p.status === 'completed' ? 'planned' : 'completed')}
                    title={p.status === 'completed' ? 'Mark as planned' : 'Mark as completed'}
                    className={`flex w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors ${
                      p.status === 'completed' ? 'border-green-mint/70 bg-green-soft text-green-deep' :
                      p.status === 'missed' ? 'border-attention/40 bg-attention/5 text-attention' :
                      'border-border/70 bg-white text-dark hover:border-green-mint/70'
                    }`}
                  >
                    <CheckCircle2 size={12} strokeWidth={2} fill={p.status === 'completed' ? '#0A6B3E' : 'none'} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 text-[10px] font-medium opacity-70">{p.durationMin}m</span>
                  </button>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border/80 px-2 py-2.5 text-center text-[10.5px] text-secondary/70">Rest day</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setPlanForm({ ...planForm, date: day.date }); setAddOpen(true); }}
              className="mt-2 inline-flex items-center justify-center gap-1 rounded-lg border border-dashed border-green-mint/70 py-1.5 text-[11px] font-medium text-green-deep transition-colors hover:bg-green-soft/60"
            >
              <Plus size={12} strokeWidth={2.2} /> Add workout
            </button>
          </div>
        ))}
      </div>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Plan Workout" description="Schedule a workout for a specific day.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Date" type="date" value={planForm.date} onChange={(e) => setPlanForm({ ...planForm, date: e.target.value })} />
            <Input label="Workout name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Leg Day" />
            <Select value={planForm.category} options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => setPlanForm({ ...planForm, category: v })} label="Category" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="number" value={planForm.durationMin.toString()} onChange={(e) => setPlanForm({ ...planForm, durationMin: Number(e.target.value) || 0 })} placeholder="Duration (min)" />
              <Select value={planForm.status} options={[{ value: 'planned', label: 'Planned' }, { value: 'completed', label: 'Completed' }, { value: 'missed', label: 'Missed' }]} onChange={(v) => setPlanForm({ ...planForm, status: v })} label="Status" />
            </div>
            <Input label="Notes (optional)" value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add to Schedule</Button>
            </div>
          </form>
        </Modal>
      )}

      <p className="text-[12px] text-secondary">Rest days are encouraged — you don't need to work out every day.</p>
    </div>
  );

  function dayPlans(date: string) {
    return (plansByDay[date] || []).sort((a, b) => a.durationMin - b.durationMin);
  }
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(weekStart: string) {
  const days = [];
  const d = new Date(weekStart + 'T12:00:00');
  const todayStr = today();
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d);
    cur.setDate(d.getDate() + i);
    days.push({ date: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`, label: cur.toLocaleDateString(undefined, { weekday: 'short' }), isToday: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}` === todayStr });
  }
  return days;
}

function formatWeekRange(weekStart: string) {
  const d = new Date(weekStart + 'T12:00:00');
  const end = new Date(d); end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
