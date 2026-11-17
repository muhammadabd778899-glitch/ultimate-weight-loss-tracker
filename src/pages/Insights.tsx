/**
 * Insights & Reports — analytics center with charts derived from real records.
 */

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { db } from '../db';
import { weightStats, workoutStats, sleepStats } from '../services/calculations';
import { today, addDays } from '../types';
import { success } from '../services/toast';

const METRICS: Array<{ value: string; label: string }> = [
  { value: 'weight', label: 'Weight Trend' },
  { value: 'calories', label: 'Daily Calories' },
  { value: 'water', label: 'Water Intake' },
  { value: 'workouts', label: 'Workout Activity' },
  { value: 'sleep', label: 'Sleep Duration' },
];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Insights & Reports</h1>
        <div className="flex gap-2">
          <Select value={metric} options={METRICS.map((m) => ({ value: m.value, label: m.label }))} onChange={setMetric} label="Metric" />
          <Select value={range} options={[{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }]} onChange={setRange} label="Range" />
          <Button size="sm" onClick={exportReport}>Export Report</Button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const wStats = weightStats(filteredWeight, 'kg');
          return (
            <>
              <StatCard title="Weight Records" value={filteredWeight.length} sub="in period" />
              <StatCard title="Current Weight" value={wStats.current != null ? wStats.current.toFixed(1) + ' kg' : '—'} sub={wStats.change != null ? `${wStats.change > 0 ? '+' : ''}${wStats.change.toFixed(1)} vs start` : ''} />
              <StatCard title="Workouts" value={filteredWorkouts.length} sub={workoutStats(filteredWorkouts).totalMinutes + ' min'} />
              <StatCard title="Avg Sleep" value={sleepStats(filteredSleep, days).avgHours || '—'} sub="hours/night" />
            </>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metric === 'weight' && <WeightChart data={filteredWeight} unit="kg" />}
        {metric === 'calories' && <CaloriesChart data={filteredMeals} days={days} endStr={endStr} />}
        {metric === 'water' && <WaterChart data={waterEntries} days={days} endStr={endStr} />}
        {metric === 'workouts' && <WorkoutsChart data={filteredWorkouts} days={days} endStr={endStr} />}
        {metric === 'sleep' && <SleepChart data={filteredSleep} days={days} endStr={endStr} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
            <CardDescription>Averaged over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Protein', value: mealAvg('protein') * 4 },
                      { name: 'Carbs', value: mealAvg('carbs') * 4 },
                      { name: 'Fat', value: mealAvg('fat') * 9 },
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%" outerRadius={90}
                  >
                    {['#2E9D59', '#A8DDB5', '#176B3A'].map((c, i) => <Cell key={`c${i}`} fill={c} />)}
                    <Tooltip />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Workout categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(workoutStats(filteredWorkouts).categoryCount).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%" outerRadius={90}
                  >
                    {['#2E9D59', '#176B3A', '#A8DDB5', '#E7BB59', '#319B61'].map((c, i) => <Cell key={`w${i}`} fill={c} />)}
                    <Tooltip />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Derived from actual records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-secondary">Total weight records</span><span className="text-dark font-medium">{weightEntries.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Total meals logged</span><span className="text-dark font-medium">{mealEntries.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Total workouts</span><span className="text-dark font-medium">{workoutSessions.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Total sleep nights</span><span className="text-dark font-medium">{sleepEntries.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Total water logs</span><span className="text-dark font-medium">{waterEntries.length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-secondary">All charts are derived from your actual local records. No estimates are presented as medical guidance.</p>
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
        waterLogs: waterEntries.filter((e) => e.date >= startStr && e.date <= endStr).length,
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

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {sub && <CardDescription className="text-[10px]">{sub}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-deep-green font-bold text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function WeightChart({ data, unit }: { data: any[]; unit: string }) {
  const sorted = [...data].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Trend</CardTitle>
        <CardDescription>{unit}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {sorted.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sorted.map((d) => ({ date: d.date.slice(5), value: d.weight }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
                <XAxis dataKey="date" stroke="#718078" fontSize={10} />
                <YAxis stroke="#718078" fontSize={10} width={40} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2E9D59" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">No weight data.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CaloriesChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = weeklyOrDailyCalories(data, days, endStr);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Calories</CardTitle>
        <CardDescription>kcal per day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {series.some((d) => d.calories > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
                <XAxis dataKey="date" stroke="#718078" fontSize={10} />
                <YAxis stroke="#718078" fontSize={10} width={40} />
                <Tooltip />
                <Bar dataKey="calories" fill="#2E9D59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">No nutrition data.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function weeklyOrDailyCalories(data: any[], days: number, endStr: string) {
  const out = [];
  const end = new Date(endStr + 'T12:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const cal = data.filter((e) => e.date === ds).reduce((s, m) => s + m.calories, 0);
    out.push({ date: ds.slice(5), calories: cal });
  }
  return out;
}

function WaterChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = [];
  const end = new Date(endStr + 'T12:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const amt = data.filter((e) => e.date === ds).reduce((s, m) => s + m.amountMl, 0);
    series.push({ date: ds.slice(5), amount: amt });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Water Intake</CardTitle>
        <CardDescription>ml per day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
              <XAxis dataKey="date" stroke="#718078" fontSize={10} />
              <YAxis stroke="#718078" fontSize={10} width={40} />
              <Tooltip />
              <Bar dataKey="amount" fill="#319B61" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutsChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = [];
  const end = new Date(endStr + 'T12:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const min = data.filter((e) => e.date === ds).reduce((s, w) => s + w.durationMin, 0);
    series.push({ date: ds.slice(5), minutes: min });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Minutes</CardTitle>
        <CardDescription>per day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
              <XAxis dataKey="date" stroke="#718078" fontSize={10} />
              <YAxis stroke="#718078" fontSize={10} width={40} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#2E9D59" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SleepChart({ data, days, endStr }: { data: any[]; days: number; endStr: string }) {
  const series = [];
  const end = new Date(endStr + 'T12:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const e = data.find((x) => x.date === ds);
    series.push({ date: ds.slice(5), hours: e ? e.durationHours : 0 });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep Duration</CardTitle>
        <CardDescription>hours per night</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
              <XAxis dataKey="date" stroke="#718078" fontSize={10} />
              <YAxis stroke="#718078" fontSize={10} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#718078" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

