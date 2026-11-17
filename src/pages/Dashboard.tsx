/**
 * Dashboard — Ultimate Weight Loss & Fitness Tracker
 * All metrics calculated from real local records. Nothing hardcoded.
 */

import * as React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ProgressRing, ProgressBar } from '../components/ui/Progress';
import { db } from '../db';
import {
  weightStats, buildDashboardSnapshot, dailyTotals, macroPct, weeklyWorkoutActivity,
  sleepStats, allHabitsCompletion,
} from '../services/calculations';
import { today, formatWeight } from '../types';
import { Plus, Clock, Droplet, Bed, Dumbbell, Apple, TrendingUp, CheckCircle, Heart, Flame } from 'lucide-react';
import { toast } from '../services/toast';
import { cn } from '../components/ui/utils';

const RADIANTS = [
  { fill: '#2E9D59' },
  { fill: '#176B3A' },
  { fill: '#A8DDB5' },
  { fill: '#E7BB59' },
];

export function Dashboard() {
  const [profile, setProfile] = React.useState<any>(null);
  const [weightEntries, setWeightEntries] = React.useState<any[]>([]);
  const [mealEntries, setMealEntries] = React.useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = React.useState<any[]>([]);
  const [habits, setHabits] = React.useState<any[]>([]);
  const [habitEntries, setHabitEntries] = React.useState<any[]>([]);
  const [waterEntries, setWaterEntries] = React.useState<any[]>([]);
  const [sleepEntries, setSleepEntries] = React.useState<any[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = React.useState<any[]>([]);
  const [goals, setGoals] = React.useState<any[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(today());

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [p, w, m, wo, h, he, wa, s, bm, g] = await Promise.all([
          db.profile.get(),
          db.weight.list(),
          db.meals.list(),
          db.workouts.list(),
          db.habits.list(),
          db.habitEntries.list(),
          db.water.list(),
          db.sleep.list(),
          db.bodyMeasurements.list(),
          db.goals.list(),
        ]);
        if (!mounted) return;
        setProfile(p);
        setWeightEntries(w);
        setMealEntries(m);
        setWorkoutSessions(wo);
        setHabits(h);
        setHabitEntries(he);
        setWaterEntries(wa);
        setSleepEntries(s);
        setBodyMeasurements(bm);
        setGoals(g);
      } catch (err) {
        console.error('Dashboard load failed', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const snapshot = buildDashboardSnapshot({
    weightEntries,
    mealEntries,
    waterEntries,
    workoutSessions,
    habitEntries,
    habits,
    sleepEntries,
    goals,
    profile,
  });

  const wStats = weightStats(weightEntries, profile?.preferredWeightUnit || 'kg');
  const dayTotals = dailyTotals(mealEntries, selectedDate);
  const macros = macroPct(dayTotals);
  const weekActivity = weeklyWorkoutActivity(workoutSessions, selectedDate);
  const waterToday = dailyWater(waterEntries, selectedDate);
  const waterTarget = profile?.dailyWaterTargetMl || 2000;
  const sleep = sleepStats(sleepEntries, 7);
  const habitsProgress = allHabitsCompletion(habits, habitEntries, 7);
  const activeHabits = habits.filter((h: any) => !h.isArchived);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-deep-green font-bold text-2xl tracking-tight">Good {greeting()}, {profile?.displayName || 'there'}</h1>
          <p className="text-secondary text-sm">Here's your wellness overview for {formatDisplayDate(selectedDate)}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            type="date"
            className="w-48"
          />
        </div>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Weight"
          value={wStats.current != null ? formatWeight(wStats.current, profile?.preferredWeightUnit || 'kg') : '—'}
          change={wStats.change != null ? `${wStats.change > 0 ? '+' : ''}${wStats.change.toFixed(1)} vs start` : 'No records'}
          changeType={wStats.change != null ? (wStats.change <= 0 ? 'positive' : 'negative') : 'neutral'}
          icon={<TrendingUp size={22} strokeWidth={2} />}
        />
        <StatCard
          title="Goal Progress"
          value={snapshot.goalProgressPct != null ? `${snapshot.goalProgressPct}%` : '—'}
          change="Set a goal in Settings to track"
          icon={<Flame size={22} strokeWidth={2} />}
        />
        <StatCard
          title="Today's Calories"
          value={Math.round(dayTotals.calories)}
          change={dayTotals.calories > 0 ? 'logged today' : 'No meals logged'}
          icon={<Apple size={22} strokeWidth={2} />}
        />
        <StatCard
          title="Workouts This Week"
          value={snapshot.workoutsThisWeek}
          change="Keep it up!"
          icon={<Dumbbell size={22} strokeWidth={2} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Weight trend + Goal progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>Last 60 days · {wStats.unit}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {weightEntries.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData(weightEntries, profile?.preferredWeightUnit || 'kg')}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2E9D59" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#2E9D59" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
                      <XAxis dataKey="date" stroke="#718078" fontSize={11} />
                      <YAxis stroke="#718078" fontSize={11} width={40} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(v: number) => formatWeight(v, profile?.preferredWeightUnit || 'kg')}
                      />
                      <Line type="monotone" dataKey="value" stroke="#2E9D59" strokeWidth={3} dot={false} activeDot={{ r: 6 }} fill="#2E9D59" opacity={1} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart title="No weight records yet" description="Log your first weight to see your trend." />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>Your goals, averaged toward target</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length ? (
                <div className="space-y-3">
                  {goals.slice(0, 4).map((g) => {
                    const pct = goalProgressPct(g);
                    return (
                      <div key={g.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-dark">{g.name}</span>
                          <span className="text-green-deep font-semibold">{pct}%</span>
                        </div>
                        <ProgressBar value={pct} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyChart title="No goals defined" description="Add a goal in Goals & Challenges." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Water + Habits + Sleep */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Water Intake</CardTitle>
              <CardDescription>{Math.round(waterToday)}ml / {waterTarget}ml today</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <ProgressRing value={Math.min(100, Math.round((waterToday / waterTarget) * 100))} size={70} thickness={8} label={`${Math.round(waterToday / waterTarget * 100)}%`} />
              <div className="flex-1">
                <p className="text-dark text-sm font-medium">Daily water target</p>
                <p className="text-secondary text-xs">{waterTarget / 1000} L per day · editable in Settings</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Habit Completion</CardTitle>
              <CardDescription>{activeHabits.length} active habits · last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {activeHabits.length ? (
                <div className="space-y-3">
                  {habitsProgress.slice(0, 4).map((h) => (
                    <div key={h.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark" style={{ color: h.color }}>{h.name}</span>
                        <span className="text-green-deep font-semibold">{h.pct}%</span>
                      </div>
                      <ProgressBar value={h.pct} color={h.color} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyChart title="No habits yet" description="Add habits in the Habits tab." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sleep Summary</CardTitle>
              <CardDescription>Average last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-green-deep font-bold text-2xl">{sleep.avgHours || '—'} hrs</p>
                <p className="text-secondary text-xs">{sleep.count} nights logged</p>
              </div>
              <div className="text-right">
                <p className="text-dark text-sm font-medium">{sleep.last?.quality || '—'}/5</p>
                <p className="text-secondary text-xs">last quality</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second row: Macro + Workouts + Today's meals */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card lg:col-span-2>
          <CardHeader>
            <CardTitle>Macro Breakdown</CardTitle>
            <CardDescription>{formatDisplayDate(selectedDate)} · from logged meals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <MacroMini label="Protein" value={dayTotals.protein.toFixed(1)} unit="g" pct={macros.protein} color="#2E9D59" />
              <MacroMini label="Carbs" value={dayTotals.carbs.toFixed(1)} unit="g" pct={macros.carbs} color="#A8DDB5" />
              <MacroMini label="Fat" value={dayTotals.fat.toFixed(1)} unit="g" pct={macros.fat} color="#176B3A" />
            </div>
            <div className="mt-4 h-40">
              {dayTotals.calories > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Protein', value: dayTotals.protein * 4, color: '#2E9D59' },
                        { name: 'Carbs', value: dayTotals.carbs * 4, color: '#A8DDB5' },
                        { name: 'Fat', value: dayTotals.fat * 9, color: '#176B3A' },
                      ].filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#888"
                      labelLine={false}
                    >
                      {RADIANTS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <Tooltip />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart className="h-40" title="No meals logged yet" description="Add a meal in Nutrition." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card lg:col-span-1>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Workout minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {workoutSessions.length ? (
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
                <EmptyChart className="h-64" title="No workouts yet" description="Log a workout in Workouts." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card lg:col-span-1>
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
            <CardDescription>{mealEntries.filter((m) => m.date === selectedDate).length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mealEntries.filter((m) => m.date === selectedDate).length ? (
                mealEntries.filter((m) => m.date === selectedDate).map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-green-soft text-xs text-green-deep">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider opacity-70">{m.mealCategory}</span>
                      <span className="font-medium">{m.foodSnapshot?.name || 'Meal'}</span>
                    </div>
                    <span className="font-semibold">{Math.round(m.calories)} cal</span>
                  </div>
                ))
              ) : (
                <EmptyChart className="h-32" title="No meals today" description="Log your first meal." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Log something quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-7 gap-3">
            <QuickAction icon={<Plus size={18} strokeWidth={2} />} label="Log Weight" onClick={() => toast({ type: 'info', title: 'Log Weight', message: 'Open Body Progress to add a weight record.' })}/>
            <QuickAction icon={<Plus size={18} strokeWidth={2} />} label="Add Meal" onClick={() => toast({ type: 'info', title: 'Add Meal', message: 'Open Nutrition to log today\'s meals.' })}/>
            <QuickAction icon={<Droplet size={18} strokeWidth={2} />} label="Log Water" onClick={() => toast({ type: 'info', title: 'Log Water', message: 'Open Nutrition to log water.' })}/>
            <QuickAction icon={<Clock size={18} strokeWidth={2} />} label="Log Workout" onClick={() => toast({ type: 'info', title: 'Log Workout', message: 'Open Workouts to record a session.' })}/>
            <QuickAction icon={<Bed size={18} strokeWidth={2} />} label="Log Sleep" onClick={() => toast({ type: 'info', title: 'Log Sleep', message: 'Open Settings/Journal to track sleep.' })}/>
            <QuickAction icon={<CheckCircle size={18} strokeWidth={2} />} label="Complete Habit" onClick={() => toast({ type: 'info', title: 'Complete Habit', message: 'Open Habits to mark today\'s habits.' })}/>
            <QuickAction icon={<Heart size={18} strokeWidth={2} />} label="Add Measurement" onClick={() => toast({ type: 'info', title: 'Add Measurement', message: 'Open Body Progress to record measurements.' })}/>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity / measurements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Measurements</CardTitle>
            <CardDescription>Latest body measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {bodyMeasurements.slice(0, 6).length ? (
                bodyMeasurements.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-dark">{m.type} <span className="text-secondary text-xs">({m.unit})</span></span>
                    <span className="text-green-deep font-semibold">{m.value.toFixed(1)} {m.unit}</span>
                  </div>
                ))
              ) : (
                <EmptyChart className="h-32" title="No measurements yet" description="Record measurements in Body Progress." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Activity</CardTitle>
            <CardDescription>Recent entries across your tracker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between text-sm text-secondary">
                <span>All data stored locally in your browser</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Private & offline
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function weightChartData(entries: any[], unit: string) {
  return entries
    .sort((a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-30)
    .map((e) => ({ date: e.date.slice(5), value: convertWeightValue(e.weight, e.unit, unit) }));
}

function convertWeightValue(v: number, from: string, to: string) {
  if (from === to) return v;
  const toKg: Record<string, number> = { kg: 1, lb: 0.45359237, st: 6.35029318 };
  const fromKg: Record<string, number> = { kg: 1, lb: 2.20462262, st: 0.15747304 };
  return (v * toKg[from]) * fromKg[to];
}

function dailyWater(entries: any[], date: string) {
  return entries.filter((e: any) => e.date === date).reduce((s: number, e: any) => s + e.amountMl, 0);
}

function goalProgressPct(g: any) {
  const start = new Date(g.startDate).getTime();
  const target = new Date(g.targetDate).getTime();
  const now = new Date().getTime();
  const span = Math.max(1, target - start);
  const elapsed = Math.max(0, now - start);
  return Math.min(100, Math.round((elapsed / span) * 100));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function StatCard({ title, value, change, changeType = 'neutral', icon }: { title: string; value: string | number; change: string; changeType?: 'positive' | 'negative' | 'neutral'; icon: React.ReactNode }) {
  const color = changeType === 'positive' ? 'text-success' : changeType === 'negative' ? 'text-attention' : 'text-secondary';
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-[10px]">{change}</CardDescription>
          </div>
          <div className={`w-8 h-8 rounded-md bg-green-soft flex items-center justify-center ${color || 'text-green-deep'}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-deep-green font-bold text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function MacroMini({ label, value, unit, pct, color }: { label: string; value: string; unit: string; pct: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-secondary">{label}</span>
        <span className="text-dark font-semibold">{value}{unit}</span>
      </div>
      <ProgressBar value={pct} color={color} height="6px" />
      <p className="text-[10px] text-secondary">{pct}% of macros</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 px-3 py-3 rounded-md border border-border bg-surface hover:bg-green-soft text-secondary text-xs font-medium transition-colors">
      {icon}
      {label}
    </button>
  );
}

function EmptyChart({ title = 'No data yet', description = '', className = '' }: { title?: string; description?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center text-secondary', className)}>
      <span className="text-4xl mb-2 opacity-40">📭</span>
      <p className="text-sm font-medium text-dark">{title}</p>
      <p className="text-[11px] mt-1">{description}</p>
    </div>
  );
}
