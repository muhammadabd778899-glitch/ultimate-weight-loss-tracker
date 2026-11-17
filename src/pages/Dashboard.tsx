/**
 * Dashboard — Ultimate Weight Loss & Fitness Tracker
 * All metrics calculated from real local records. Nothing hardcoded.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '../components/ui/Card';
import { ProgressBar, ProgressRing } from '../components/ui/Progress';
import { db } from '../db';
import {
  weightStats, buildDashboardSnapshot, dailyTotals, macroPct, weeklyWorkoutActivity,
  sleepStats, allHabitsCompletion,
} from '../services/calculations';
import { today, formatWeight, convertWeight } from '../types';
import {
  Activity, Apple, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, Dumbbell, Droplets,
  Flame, Inbox, Moon, Plus, Ruler, TrendingDown, TrendingUp, Utensils,
} from 'lucide-react';
import { cn } from '../components/ui/utils';

const MACRO_COLORS = ['#169C5C', '#7BD3A0', '#0A6B3E'];

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

  const unit = profile?.preferredWeightUnit || 'kg';
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

  const wStats = weightStats(weightEntries, unit);
  const dayTotals = dailyTotals(mealEntries, selectedDate);
  const macros = macroPct(dayTotals);
  const weekActivity = weeklyWorkoutActivity(workoutSessions, selectedDate);
  const weeklyMinutes = Math.round(weekActivity.reduce((sum, day) => sum + day.minutes, 0));
  const waterToday = dailyWater(waterEntries, selectedDate);
  const waterTarget = profile?.dailyWaterTargetMl || 2000;
  const waterPct = waterTarget > 0 ? Math.round((waterToday / waterTarget) * 100) : 0;
  const sleep = sleepStats(sleepEntries, 7);
  const habitsProgress = allHabitsCompletion(habits, habitEntries, 7);
  const activeHabits = habits.filter((h: any) => !h.isArchived);
  const mealsToday = mealEntries.filter((m) => m.date === selectedDate);
  const goalPct = snapshot.goalProgressPct;

  const weightChange = wStats.change;
  const weightDirection = weightChange == null ? 'flat' : weightChange < 0 ? 'down' : weightChange > 0 ? 'up' : 'flat';

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0A472B] via-[#0E6B3D] to-[#169C5C] px-6 py-7 text-white shadow-[0_34px_70px_-40px_rgba(9,70,40,0.85)] sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-20 h-80 w-80 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 right-40 h-80 w-80 rounded-full border border-white/[0.07]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-medium tracking-wide text-white/90 backdrop-blur">
              <CalendarDays size={13} strokeWidth={2} />
              {formatDisplayDate(selectedDate)}
            </span>
            <h1 className="mt-4 text-[27px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[34px]">
              Good {greeting()}, {profile?.displayName || 'there'}
            </h1>
            <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-white/70">
              Your wellness snapshot — weight, fuel, movement and habits, built only from your own records.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to="/body-progress"
                className="inline-flex h-10 items-center gap-2 rounded-control bg-white px-4 text-[13px] font-semibold text-[#0A5C36] shadow-[0_12px_24px_-14px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5"
              >
                <Plus size={16} strokeWidth={2.4} />
                Log weight
              </Link>
              <Link
                to="/nutrition"
                className="inline-flex h-10 items-center gap-2 rounded-control border border-white/25 bg-white/10 px-4 text-[13px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <Utensils size={15} strokeWidth={2} />
                Add a meal
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">Current weight</p>
                <p className="stat-number mt-2 text-[34px] font-semibold leading-none sm:text-[38px]">
                  {wStats.current != null ? wStats.current.toFixed(1) : '—'}
                  {wStats.current != null && <span className="ml-1.5 text-[13px] font-medium tracking-normal text-white/60">{unit}</span>}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-medium">
                {weightDirection === 'down' ? <TrendingDown size={12} strokeWidth={2.4} /> : weightDirection === 'up' ? <TrendingUp size={12} strokeWidth={2.4} /> : <Activity size={12} strokeWidth={2.4} />}
                {weightChange == null ? 'No records' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ${unit}`}
              </span>
            </div>
            <p className="mt-2 text-[11.5px] text-white/55">
              {weightChange == null ? 'Log your first weight to start a trend' : 'Change since your first entry'}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
              <label htmlFor="dashboard-date" className="text-[12px] font-medium text-white/60">Viewing date</label>
              <input
                id="dashboard-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                type="date"
                className="h-9 rounded-[10px] border border-white/20 bg-white/10 px-3 text-[12px] text-white outline-none [color-scheme:dark] transition-colors focus:border-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Summary tiles */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          label="Goal progress"
          value={goalPct != null ? `${goalPct}%` : '—'}
          note={goals.length ? `${goals.length} active ${goals.length === 1 ? 'goal' : 'goals'} · average progress` : 'No goals set yet'}
          icon={<Flame size={18} strokeWidth={2} />}
          tint="bg-[#FCF4E4] text-[#A9741F]"
          progress={goalPct ?? undefined}
        />
        <StatTile
          label="Calories today"
          value={Math.round(dayTotals.calories)}
          unit="kcal"
          note={mealsToday.length ? `${mealsToday.length} ${mealsToday.length === 1 ? 'meal' : 'meals'} logged` : 'Nothing logged yet'}
          icon={<Apple size={18} strokeWidth={2} />}
          tint="bg-[#FDEDE9] text-[#C25241]"
        />
        <StatTile
          label="Water today"
          value={(waterToday / 1000).toFixed(2)}
          unit="L"
          note={`of ${(waterTarget / 1000).toFixed(1)} L target`}
          icon={<Droplets size={18} strokeWidth={2} />}
          tint="bg-[#EAF1FB] text-[#3457A6]"
          progress={Math.min(100, waterPct)}
        />
        <StatTile
          label="Workouts"
          value={snapshot.workoutsThisWeek}
          unit="this week"
          note={weeklyMinutes ? `${weeklyMinutes} minutes moved` : 'No sessions in the last 7 days'}
          icon={<Dumbbell size={18} strokeWidth={2} />}
          tint="bg-[#EFEAFB] text-[#6A4CB0]"
        />
      </section>

      {/* Trend + right rail */}
      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <div>
              <CardTitle>Weight trend</CardTitle>
              <CardDescription>Last 30 entries · shown in {unit}</CardDescription>
            </div>
            {wStats.change != null && (
              <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">
                {wStats.change > 0 ? '+' : ''}{wStats.change.toFixed(1)} {unit} overall
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full sm:h-[300px]">
              {weightEntries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightChartData(weightEntries, unit)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#169C5C" stopOpacity={0.26} />
                        <stop offset="100%" stopColor="#169C5C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={28} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={40} />
                    <Tooltip content={<ChartTip format={(v: number) => formatWeight(v, unit)} />} />
                    <Area type="monotone" dataKey="value" stroke="#0F8A4F" strokeWidth={2.5} fill="url(#weightFill)" activeDot={{ r: 5, strokeWidth: 3, stroke: '#ffffff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel icon={Activity} title="No weight records yet" description="Log your first weight to unlock your trend line." className="h-full" />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <Card padding="md">
            <CardHeader>
              <div>
                <CardTitle>Hydration</CardTitle>
                <CardDescription>Today · {waterPct}% of target</CardDescription>
              </div>
              <Link to="/nutrition" className="rounded-full p-1.5 text-secondary transition-colors hover:bg-green-soft hover:text-green-deep" aria-label="Log water">
                <Plus size={17} strokeWidth={2.2} />
              </Link>
            </CardHeader>
            <CardContent className="flex items-center gap-5">
              <ProgressRing value={Math.min(100, waterPct)} size={96} thickness={9} label={`${Math.min(100, waterPct)}%`} />
              <div className="min-w-0 flex-1">
                <p className="stat-number text-2xl font-semibold text-dark">{(waterToday / 1000).toFixed(2)}<span className="ml-1 text-sm font-medium text-secondary">L</span></p>
                <p className="mt-1 text-xs text-secondary">of {(waterTarget / 1000).toFixed(1)} L daily target</p>
                <div className="mt-3"><ProgressBar value={Math.min(100, waterPct)} height="6px" /></div>
              </div>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <div>
                <CardTitle>Sleep</CardTitle>
                <CardDescription>Average of last 7 nights</CardDescription>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EEF2FD] text-[#4A5BA8]">
                <Moon size={17} strokeWidth={2} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="stat-number text-[28px] font-semibold leading-none text-dark">
                    {sleep.avgHours || '—'}
                    <span className="ml-1.5 text-sm font-medium text-secondary">hrs</span>
                  </p>
                  <p className="mt-1.5 text-xs text-secondary">{sleep.count} {sleep.count === 1 ? 'night' : 'nights'} logged</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={cn('h-1.5 w-4 rounded-full', (sleep.last?.quality || 0) >= n ? 'bg-[#4A5BA8]' : 'bg-[#E4E9F4]')} />
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] text-secondary">last quality</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Macros / activity / meals */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Macros today</CardTitle>
              <CardDescription>{formatDisplayDate(selectedDate)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {dayTotals.calories > 0 ? (
              <>
                <div className="relative mx-auto h-[168px] w-full max-w-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Protein', value: dayTotals.protein * 4 },
                          { name: 'Carbs', value: dayTotals.carbs * 4 },
                          { name: 'Fat', value: dayTotals.fat * 9 },
                        ].filter((d) => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                      >
                        {MACRO_COLORS.map((fill, index) => (
                          <Cell key={index} fill={fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTip format={(v: number) => `${Math.round(v)} kcal`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="stat-number text-xl font-semibold text-dark">{Math.round(dayTotals.calories)}</span>
                    <span className="mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.14em] text-secondary">kcal</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  <MacroRow label="Protein" grams={dayTotals.protein} pct={macros.protein} color={MACRO_COLORS[0]} />
                  <MacroRow label="Carbs" grams={dayTotals.carbs} pct={macros.carbs} color={MACRO_COLORS[1]} />
                  <MacroRow label="Fat" grams={dayTotals.fat} pct={macros.fat} color={MACRO_COLORS[2]} />
                </div>
              </>
            ) : (
              <EmptyPanel icon={Utensils} title="No meals logged" description="Add a meal in Nutrition to see your macro split." className="h-[250px]" />
            )}
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Weekly activity</CardTitle>
              <CardDescription>{weeklyMinutes ? `${weeklyMinutes} minutes · last 7 days` : 'Workout minutes · last 7 days'}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {workoutSessions.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekActivity.map((d) => ({ label: weekdayLabel(d.date), minutes: d.minutes }))} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1EAE68" />
                        <stop offset="100%" stopColor="#169C5C" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={8} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={32} />
                    <Tooltip cursor={{ fill: 'rgba(22,156,92,0.06)' }} content={<ChartTip format={(v: number) => `${v} min`} />} />
                    <Bar dataKey="minutes" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel icon={Dumbbell} title="No workouts yet" description="Record a session to build your activity streak." className="h-full" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Today's meals</CardTitle>
              <CardDescription>{mealsToday.length} {mealsToday.length === 1 ? 'entry' : 'entries'}</CardDescription>
            </div>
            <Link to="/nutrition" className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep hover:underline">
              Open <ArrowUpRight size={14} strokeWidth={2.2} />
            </Link>
          </CardHeader>
          <CardContent>
            {mealsToday.length ? (
              <div className="max-h-[250px] space-y-2 overflow-y-auto pr-1">
                {mealsToday.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-[#FBFDFB] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-dark">{m.foodSnapshot?.name || 'Meal'}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">{m.mealCategory}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-green-deep shadow-[0_1px_2px_rgba(16,40,28,0.06)]">
                      {Math.round(m.calories)} kcal
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={Apple} title="Nothing logged today" description="Your meals will appear here as you log them." className="h-[250px]" />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick log */}
      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Quick log</CardTitle>
            <CardDescription>Jump straight into a record</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7">
            <QuickLog to="/body-progress" icon={TrendingUp} label="Weight" />
            <QuickLog to="/nutrition" icon={Utensils} label="Meal" />
            <QuickLog to="/nutrition" icon={Droplets} label="Water" />
            <QuickLog to="/workouts" icon={Dumbbell} label="Workout" />
            <QuickLog to="/habits" icon={CheckCircle2} label="Habit" />
            <QuickLog to="/body-progress" icon={Ruler} label="Measurement" />
            <QuickLog to="/journal" icon={BookOpen} label="Journal" />
          </div>
        </CardContent>
      </Card>

      {/* Habits + measurements */}
      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <div>
              <CardTitle>Habit consistency</CardTitle>
              <CardDescription>Completion across the last 7 days</CardDescription>
            </div>
            <Link to="/habits" className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep hover:underline">
              Manage <ArrowUpRight size={14} strokeWidth={2.2} />
            </Link>
          </CardHeader>
          <CardContent>
            {activeHabits.length ? (
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {habitsProgress.slice(0, 6).map((h) => (
                  <div key={h.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13px] font-medium text-dark">{h.name}</p>
                      <span className="shrink-0 text-[11.5px] font-semibold text-green-deep">{h.pct}%</span>
                    </div>
                    <ProgressBar value={h.pct} height="7px" />
                    <p className="text-[12px] text-secondary">{h.completed} of {h.total} days · {h.streak} day streak</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={CheckCircle2} title="No habits yet" description="Add small daily habits in the Habits tab to build momentum." className="h-[190px]" />
            )}
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Recent measurements</CardTitle>
              <CardDescription>Latest body records</CardDescription>
            </div>
            <Link to="/body-progress" className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep hover:underline">
              All <ArrowUpRight size={14} strokeWidth={2.2} />
            </Link>
          </CardHeader>
          <CardContent>
            {bodyMeasurements.length ? (
              <div className="space-y-1">
                {bodyMeasurements.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-dark">{measurementLabel(m.type)}</p>
                      <p className="mt-0.5 text-[12px] text-secondary">{formatShortDate(m.date)}</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold text-green-deep">{m.value.toFixed(1)} {m.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={Ruler} title="Nothing tracked yet" description="Record waist, hips or arm measurements in Body Progress." className="h-[190px]" />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatTile({
  label, value, unit, note, icon, tint, progress,
}: {
  label: string;
  value: string | number;
  unit?: string;
  note: string;
  icon: React.ReactNode;
  tint: string;
  progress?: number;
}) {
  return (
    <Card interactive padding="sm" className="flex flex-col sm:p-7">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary sm:text-[10.5px] sm:tracking-[0.16em]">{label}</p>
        <span className={cn('hidden h-9 w-9 shrink-0 place-items-center rounded-xl sm:grid', tint)}>{icon}</span>
      </div>
      <p className="stat-number mt-3 text-[26px] font-semibold leading-none text-dark sm:mt-4 sm:text-[30px]">
        {value}
        {unit && <span className="ml-1.5 text-[12px] font-medium tracking-normal text-secondary">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-secondary sm:mt-2 sm:text-[11.5px]">{note}</p>
      {progress != null && <div className="mt-auto pt-3 sm:pt-4"><ProgressBar value={progress} height="5px" /></div>}
    </Card>
  );
}

function MacroRow({ label, grams, pct, color }: { label: string; grams: number; pct: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px]">
      <span className="inline-flex items-center gap-2 text-secondary">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-dark">
        <span className="font-semibold">{grams.toFixed(1)} g</span>
        <span className="ml-2 text-[12px] text-secondary">{pct}%</span>
      </span>
    </div>
  );
}

function QuickLog({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-3.5 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-green-mint/60 hover:bg-white hover:shadow-card"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-green-soft text-green-deep transition-colors group-hover:bg-[#DCF1E4]">
        <Icon size={17} strokeWidth={2} />
      </span>
      <span className="text-[12px] font-medium text-dark">{label}</span>
    </Link>
  );
}

function EmptyPanel({
  icon: Icon = Inbox, title, description, className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#FBFDFB] px-5 py-8 text-center', className)}>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft text-green-deep">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-[13px] font-medium text-dark">{title}</p>
      {description && <p className="mt-1 max-w-[230px] text-[11.5px] leading-relaxed text-secondary">{description}</p>}
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

function weightChartData(entries: any[], unit: string) {
  return [...entries]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-30)
    .map((e) => ({ label: formatShortDate(e.date), value: Math.round(convertWeight(e.weight, e.unit, unit as any) * 10) / 10 }));
}

function dailyWater(entries: any[], date: string) {
  return entries.filter((e) => e.date === date).reduce((s, e) => s + e.amountMl, 0);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function weekdayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function measurementLabel(type: string) {
  const spaced = type.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
