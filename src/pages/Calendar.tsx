/**
 * Calendar — visual timeline of all wellness activity.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { db } from '../db';
import { today } from '../types';

type View = 'month' | 'week' | 'day';

export function CalendarPage() {
  const [view, setView] = React.useState<View>('month');
  const [selectedDate, setSelectedDate] = React.useState(today());
  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const [w, bm, me, wo, he, wa, s, g, j] = await Promise.all([
        db.weight.list(), db.bodyMeasurements.list(), db.meals.list(),
        db.workouts.list(), db.habitEntries.list(),
        db.water.list(), db.sleep.list(), db.goals.list(), db.journal.list(),
      ]);
      if (!mounted) return;
      const ev: any[] = [];
      w.forEach((e) => ev.push({ date: e.date, type: 'weight', title: `Weight: ${e.weight}${e.unit}`, recordId: e.id, color: '#2E9D59' }));
      bm.forEach((e) => ev.push({ date: e.date, type: 'measurement', title: `${e.type}: ${e.value}${e.unit}`, recordId: e.id, color: '#176B3A' }));
      me.forEach((e) => ev.push({ date: e.date, type: 'meal', title: `Meal: ${e.foodSnapshot?.name}`, recordId: e.id, color: '#A8DDB5' }));
      wo.forEach((e) => ev.push({ date: e.date, type: 'workout', title: `Workout: ${e.name}`, recordId: e.id, color: '#D94F6F' }));
      he.filter((e) => e.completed).forEach((e) => ev.push({ date: e.date, type: 'habit', title: 'Habit completed', recordId: e.id, color: '#2E9D59' }));
      wa.forEach((e) => ev.push({ date: e.date, type: 'water', title: `Water: ${e.amountMl}ml`, recordId: e.id, color: '#319B61' }));
      s.forEach((e) => ev.push({ date: e.date, type: 'sleep', title: `Sleep: ${e.durationHours}h`, recordId: e.id, color: '#718078' }));
      g.forEach((e) => ev.push({ date: e.targetDate, type: 'goal', title: `Goal: ${e.name}`, recordId: e.id, color: '#E7BB59' }));
      j.forEach((e) => ev.push({ date: e.date, type: 'journal', title: 'Journal entry', recordId: e.id, color: '#176B3A' }));
      setEvents(ev);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const dayEvents = events.filter((e) => e.date === selectedDate);

  const prev = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - (view === 'month' ? 30 : view === 'week' ? 7 : 1));
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };
  const next = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + (view === 'month' ? 30 : view === 'week' ? 7 : 1));
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Calendar</h1>
        <div className="flex gap-1 rounded-md border border-border bg-surface p-0.5">
          {['month', 'week', 'day'].map((v) => (
            <button key={v} onClick={() => setView(v as View)} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === v ? 'bg-green-soft text-green-deep' : 'text-secondary hover:text-green-deep'}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={prev}><ChevronLeft size={16} strokeWidth={2} /></Button>
        <Input label="Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48" />
        <Button variant="outline" size="sm" onClick={next}><ChevronRight size={16} strokeWidth={2} /></Button>
        <Button size="sm"><CalIcon size={16} strokeWidth={2} /> Today</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid (month view simplified) */}
        <Card lg:col-span-2>
          <CardHeader>
            <CardTitle>{new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</CardTitle>
            <CardDescription>{dayEvents.length} events on {formatDate(selectedDate)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-[10px]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-secondary font-medium">{d}</div>
              ))}
              {calendarDays(selectedDate).map((day) => (
                <div
                  key={day.date}
                  className={`aspect-square flex flex-col items-center justify-center rounded-md text-[11px] cursor-pointer transition-colors ${day.isToday ? 'bg-green-soft text-green-deep font-semibold' : ''} ${day.inMonth ? '' : 'text-secondary/40'}`}
                  onClick={() => day.inMonth && setSelectedDate(day.date)}
                >
                  <span>{day.day}</span>
                  {dayEvents.filter((e) => e.date === day.date).length > 0 && (
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-deep" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card lg:col-span-1>
          <CardHeader>
            <CardTitle>{formatDateLong(selectedDate)}</CardTitle>
            <CardDescription>Activity summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayEvents.length ? (
                dayEvents.map((e) => (
                  <div key={`${e.date}-${e.type}-${e.recordId}`} className="flex items-center gap-2 p-1.5 rounded-md bg-green-soft/50">
                    <span className="text-[10px]" style={{ color: e.color }}>{e.type[0].toUpperCase()}</span>
                    <span className="text-sm text-dark">{e.title}</span>
                  </div>
                ))
              ) : (
                <div className="text-secondary text-center py-4 text-sm">No activity recorded.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function calendarDays(monthStr: string) {
    const d = new Date(monthStr + 'T12:00:00');
    const year = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const days = [];
    let cur = new Date(start);
    while (cur <= last || cur.getDay() !== 1) {
      const inMonth = cur.getMonth() === month;
      const curStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      days.push({ date: curStr, day: cur.getDate(), inMonth, isToday: curStr === today() });
      cur.setDate(cur.getDate() + 1);
      if (days.length > 40) break;
    }
    return days;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateLong(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
}
