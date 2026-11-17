/**
 * Insights & Reports — analytics center with charts derived from real records.
 */

import * as React from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { db } from '../db';
import { weightStats, workoutStats, sleepStats } from '../services/calculations';
import { today, addDays } from '../types';
import { success } from '../services/toast';
import { Activity, BarChart3, Droplets, Dumbbell, Flame, Moon, PieChart as PieIcon, TrendingUp } from 'lucide-react';

const METRICS: Array<{ value: string; label: string }> = [
  { value: 'weight', label: 'Weight Trend' },
  { value: 'calories', label: 'Daily Calories' },
  { value: 'water', label: 'Water Intake' },
  { value: 'workouts', label: 'Workout Activity' },
  { value: 'sleep', label: 'Sleep Duration' },
];

const MACRO_COLORS = ['#169C5C', '#7BD3A0', '#0A6B3E'];
const CATEGORY_COLORS = ['#169C5C', '#0A6B3E', '#7BD3A0', '#D8A84E', '#5E7367'];

export function Insights() {
  const [weightEntries, setWeightEntries] = React.useState<any[]>([]);
  const [mealEntries, setMealEntries] = React.useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = React.useState<any[]>([]);
  const [sleepEntries, setSleepEntries] = React.useState<any[]>([]);
  const [waterEntries, setWaterEntries] = React.useState<any[]>([]);
  const [metric, setMetric] = React.useState('weight');
  const [range, setRange] = React.useState('30d');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [w, m, wo, s, wa] = await Promise.all([
        db.weight.list(), db.meals.list(), db.workouts.list(), db.sleep.list(), db.water.list(),
      ]);
      if (!mounted) return;
      setWeightEntries(w);
      setMealEntries(m);
      setWorkoutSessions(wo);
      setSleepEntries(s);
      setWaterEntries(wa);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const end = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const startDate = addDays(end, -days);
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const endStr = today();

  const filteredWeight = weightEntries.filter((e) => e.date >= startStr && e.date <= endStr);
  const filteredMeals = mealEntries.filter((e) => e.date >= startStr && e.date <= endStr);
  const filteredWorkouts = workoutSessions.filter((e) => e.date >= startStr && e.date <= endStr);
  const filteredSleep = sleepEntries.filter((e) => e.date >= startStr && e.date <= endStr);
  const filteredWater = waterEntries.filter((e) => e.date >= startStr && e.date <= endStr);

  const wStats = weightStats(filteredWeight, 'kg');
  const macroData = [
    { name: 'Protein', value: mealAvg('protein') * 4 },
    { name: 'Carbs', value: mealAvg('carbs') * 4 },
    { name: 'Fat', value: mealAvg('fat') * 9 },
  ].filter((d) => d.value > 0);
  const macroTotal = macroData.reduce((s, d) => s + d.value, 0);
  const categoryCounts = workoutStats(filteredWorkouts).categoryCount;
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Insights &amp; Reports</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">Every chart is built from your own local records.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,8rem)_auto] lg:w-auto">
          <Select value={metric} options={METRICS.map((m) => ({ value: m.value, label: m.label }))} onChange={setMetric} label="Metric" />
          <Select value={range} options={[{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }]} onChange={setRange} label="Range" />
          <Button size="sm" onClick={exportReport} className="col-span-2 h-11 self-end sm:col-span-1">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={TrendingUp} tint="bg-green-soft text-green-deep" title="Weight records" value={filteredWeight.length} sub="in selected period" />
        <StatCard
          icon={Activity}
          tint="bg-[#FCF4E4] text-[#A9741F]"
          title="Current weight"
          value={wStats.current != null ? wStats.current.toFixed(1) : '—'}
          unit="kg"
          sub={wStats.change != null ? `${wStats.change > 0 ? '+' : ''}${wStats.change.toFixed(1)} vs start` : 'No change recorded'}
        />
        <StatCard
          icon={Dumbbell}
          tint="bg-[#EFEAFB] text-[#6A4CB0]"
          title="Workouts"
          value={filteredWorkouts.length}
          sub={`${Math.round(workoutStats(filteredWorkouts).totalMinutes)} min moved`}
        />
        <StatCard
          icon={Moon}
          tint="bg-[#EEF2FD] text-[#4A5BA8]"
          title="Avg sleep"
          value={sleepStats(filteredSleep, days).avgHours || '—'}
          unit="hrs"
          sub="per night"
        />
      </div>

      {/* Selected metric chart */}
      <div>
        {metric === 'weight' && <WeightChart data={filteredWeight} unit="kg" />}
        {metric === 'calories' && <CaloriesChart data={filteredMeals} days={days} endStr={endStr} />}
        {metric === 'water' && <WaterChart data={filteredWater} days={days} endStr={endStr} />}
        {metric === 'workouts' && <WorkoutsChart data={filteredWorkouts} days={days} endStr={endStr} />}
        {metric === 'sleep' && <SleepChart data={filteredSleep} days={days} endStr={endStr} />}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Macro distribution</CardTitle>
              <CardDescription>Average calorie share</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {macroData.length ? (
              <>
                <div className="relative mx-auto h-[180px] w-full max-w-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={80} paddingAngle={3} cornerRadius={6} stroke="none">
                        {macroData.map((entry, i) => <Cell key={entry.name} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTip format={(v: number) => `${Math.round(v)} kcal`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="stat-number text-xl font-semibold text-dark">{Math.round(macroTotal)}</span>
                    <span className="mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.14em] text-secondary">avg kcal</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {macroData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between text-[12.5px]">
                      <span className="inline-flex items-center gap-2 text-secondary">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[i % MACRO_COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="text-dark">
                        <span className="font-semibold">{Math.round(entry.value)} kcal</span>
                        <span className="ml-2 text-[12px] text-secondary">{Math.round((entry.value / macroTotal) * 100)}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChart icon={PieIcon} title="No meal data" description="Log meals in Nutrition to see your macro split." />
            )}
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Workout mix</CardTitle>
              <CardDescription>Categories in period</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {categoryData.length ? (
              <>
                <div className="mx-auto h-[180px] w-full max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} cornerRadius={6} stroke="none">
                        {categoryData.map((entry, i) => <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTip format={(v: number) => `${v} ${v === 1 ? 'session' : 'sessions'}`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2">
                  {categoryData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between gap-2 text-[11.5px]">
                      <span className="flex min-w-0 items-center gap-1.5 text-secondary">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="truncate capitalize">{entry.name}</span>
                      </span>
                      <span className="stat-number shrink-0 font-semibold text-dark">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChart icon={BarChart3} title="No workout data" description="Record a session to see how your training splits." />
            )}
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Totals across all time</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/70">
              <SummaryRow label="Weight records" value={weightEntries.length} />
              <SummaryRow label="Meals logged" value={mealEntries.length} />
              <SummaryRow label="Workouts" value={workoutSessions.length} />
              <SummaryRow label="Sleep nights" value={sleepEntries.length} />
              <SummaryRow label="Water logs" value={waterEntries.length} />
            </div>
            <p className="mt-4 rounded-xl bg-green-soft/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-secondary">
              Water logs in the selected period: <span className="font-semibold text-dark">{filteredWater.length}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-[12px] leading-relaxed text-secondary">All charts are derived from your actual local records. No estimates are presented as medical guidance.</p>
    </div>
  );

  function mealAvg(field: string) {
    if (!filteredMeals.length) return 0;
    return filteredMeals.reduce((s, m) => s + (m[field] || 0), 0) / filteredMeals.length;
  }

  function exportReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      range, metric,
      stats: {
        weightRecords: filteredWeight.length,
        meals: filteredMeals.length,
        workouts: filteredWorkouts.length,
        sleepNights: filteredSleep.length,
        waterLogs: filteredWater.length,
      },
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellness-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Report exported');
  }
}

function StatCard({
  icon: Icon, tint, title, value, unit, sub,
}: {
  icon: React.ElementType;
  tint: string;
  title: string;
  value: string | number;
  unit?: string;
  sub?: string;
}) {
  return (
    <Card padding="none" className="flex min-h-[124px] flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-secondary">{title}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tint}`}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
      <div>
        <p className="stat-number mt-3 text-[26px] font-semibold leading-none text-dark">
          {value}
          {unit && <span className="ml-1.5 text-[12px] font-medium tracking-normal text-secondary">{unit}</span>}
        </p>
        {sub && <p className="mt-1.5 text-[11.5px] leading-relaxed text-secondary">{sub}</p>}
      </div>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[12.5px]">
      <span className="text-secondary">{label}</span>
      <span className="stat-number font-semibold text-dark">{value}</span>
    </div>
  );
}

function ChartShell({
  title, description, accent, children,
}: {
  title: string;
  description: string;
  accent?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {accent}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyChart({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#FBFDFB] px-5 text-center">
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

function WeightChart({ data, unit }: { data: any[]; unit: string }) {
  const sorted = [...data].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const change = sorted.length > 1 ? sorted[sorted.length - 1].weight - sorted[0].weight : null;
  return (
    <ChartShell
      title="Weight trend"
      description="Entries inside the selected range"
      accent={change != null ? (
        <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">
          {change > 0 ? '+' : ''}{change.toFixed(1)} {unit} in range
        </span>
      ) : undefined}
    >
      <div className="h-[300px] w-full">
        {sorted.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sorted.map((d) => ({ label: shortDate(d.date), value: d.weight }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="insightWeightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#169C5C" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="#169C5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={28} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={44} />
              <Tooltip content={<ChartTip format={(v: number) => `${v.toFixed(1)} ${unit}`} />} />
              <Area type="monotone" dataKey="value" stroke="#0F8A4F" strokeWidth={2.5} fill="url(#insightWeightFill)" activeDot={{ r: 5, strokeWidth: 3, stroke: '#ffffff' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart icon={TrendingUp} title="No weight data" description="Log your weight in Body Progress to build this trend." />
        )}
      </div>
    </ChartShell>
  );
}

function CaloriesChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = dailySeries(days, endStr, data, (e) => e.calories);
  const total = series.reduce((s, d) => s + d.value, 0);
  return (
    <ChartShell
      title="Daily calories"
      description="kcal logged per day"
      accent={total > 0 ? <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">{(total / series.length).toFixed(0)} kcal / day avg</span> : undefined}
    >
      <div className="h-[300px] w-full">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={44} />
              <Tooltip cursor={{ fill: 'rgba(22,156,92,0.06)' }} content={<ChartTip format={(v: number) => `${Math.round(v)} kcal`} />} />
              <Bar dataKey="value" fill="#169C5C" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart icon={Flame} title="No nutrition data" description="Log meals to see your daily calorie pattern." />
        )}
      </div>
    </ChartShell>
  );
}

function WaterChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = dailySeries(days, endStr, data, (e) => e.amountMl);
  const total = series.reduce((s, d) => s + d.value, 0);
  return (
    <ChartShell
      title="Water intake"
      description="ml logged per day"
      accent={total > 0 ? <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">{(total / 1000).toFixed(1)} L total</span> : undefined}
    >
      <div className="h-[300px] w-full">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={44} />
              <Tooltip cursor={{ fill: 'rgba(22,156,92,0.06)' }} content={<ChartTip format={(v: number) => `${v} ml`} />} />
              <Bar dataKey="value" fill="#7BD3A0" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart icon={Droplets} title="No water logs" description="Add water in Nutrition to see hydration over time." />
        )}
      </div>
    </ChartShell>
  );
}

function WorkoutsChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = dailySeries(days, endStr, data, (e) => e.durationMin);
  const total = series.reduce((s, d) => s + d.value, 0);
  return (
    <ChartShell
      title="Workout minutes"
      description="Active minutes per day"
      accent={total > 0 ? <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">{total} min total</span> : undefined}
    >
      <div className="h-[300px] w-full">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={44} />
              <Tooltip cursor={{ fill: 'rgba(22,156,92,0.06)' }} content={<ChartTip format={(v: number) => `${v} min`} />} />
              <Bar dataKey="value" fill="#169C5C" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart icon={Dumbbell} title="No workouts" description="Record a session to see how your activity builds." />
        )}
      </div>
    </ChartShell>
  );
}

function SleepChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = dailySeries(days, endStr, data, (e) => e.durationHours);
  const total = series.reduce((s, d) => s + d.value, 0);
  return (
    <ChartShell
      title="Sleep duration"
      description="Hours recorded per night"
      accent={total > 0 ? <span className="rounded-full bg-green-soft px-3 py-1.5 text-[12px] font-semibold text-green-deep">{sleepStats(data, days).avgHours} h avg</span> : undefined}
    >
      <div className="h-[300px] w-full">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={44} />
              <Tooltip content={<ChartTip format={(v: number) => `${v} h`} />} />
              <Line type="monotone" dataKey="value" stroke="#4A5BA8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#ffffff' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart icon={Moon} title="No sleep logs" description="Log your sleep to see nightly duration and averages." />
        )}
      </div>
    </ChartShell>
  );
}

function dailySeries(days: number, endStr: string, data: any[], pick: (entry: any) => number) {
  const out: Array<{ label: string; value: number }> = [];
  const end = new Date(endStr + 'T12:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const value = data.filter((e) => e.date === ds).reduce((s, e) => s + pick(e), 0);
    out.push({ label: shortDate(ds), value });
  }
  return out;
}

function shortDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
