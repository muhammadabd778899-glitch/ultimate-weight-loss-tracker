/**
 * Calendar — visual timeline of all wellness activity.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
      w.forEach((e) => ev.push({ date: e.date, type: 'weight', title: `Weight: ${Number(e.weight).toFixed(1)} ${e.unit}`, recordId: e.id, color: '#2E9D59' }));
      bm.forEach((e) => ev.push({ date: e.date, type: 'measurement', title: `${e.type}: ${Number(e.value).toFixed(1)} ${e.unit}`, recordId: e.id, color: '#176B3A' }));
      me.forEach((e) => ev.push({ date: e.date, type: 'meal', title: `Meal: ${e.foodSnapshot?.name}`, recordId: e.id, color: '#A8DDB5' }));
      wo.forEach((e) => ev.push({ date: e.date, type: 'workout', title: `Workout: ${e.name}`, recordId: e.id, color: '#D94F6F' }));
      he.filter((e) => e.completed).forEach((e) => ev.push({ date: e.date, type: 'habit', title: 'Habit completed', recordId: e.id, color: '#2E9D59' }));
      wa.forEach((e) => ev.push({ date: e.date, type: 'water', title: `Water: ${Math.round(e.amountMl)} ml`, recordId: e.id, color: '#319B61' }));
      s.forEach((e) => ev.push({ date: e.date, type: 'sleep', title: `Sleep: ${Number(e.durationHours).toFixed(1)} h`, recordId: e.id, color: '#718078' }));
      g.forEach((e) => ev.push({ date: e.targetDate, type: 'goal', title: `Goal: ${e.name}`, recordId: e.id, color: '#E7BB59' }));
      j.forEach((e) => ev.push({ date: e.date, type: 'journal', title: 'Journal entry', recordId: e.id, color: '#176B3A' }));
      setEvents(ev);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const dayEvents = events.filter((e) => e.date === selectedDate);

  const shift = (direction: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    if (view === 'month') d.setMonth(d.getMonth() + direction);
    else d.setDate(d.getDate() + direction * (view === 'week' ? 7 : 1));
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };
  const prev = () => shift(-1);
  const next = () => shift(1);

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Calendar</h1>
        <div className="inline-flex gap-1 rounded-control border border-border bg-white p-1 shadow-card">
          {['month', 'week', 'day'].map((v) => (
            <button key={v} onClick={() => setView(v as View)} className={`rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${view === v ? 'bg-green-soft text-green-deep' : 'text-secondary hover:bg-black/[0.03] hover:text-dark'}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-control border border-border bg-white p-1 shadow-card">
          <button onClick={prev} aria-label="Previous" className="grid h-8 w-8 place-items-center rounded-[9px] text-secondary transition-colors hover:bg-black/[0.04] hover:text-dark">
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <input
            type="date"
            value={selectedDate}
            aria-label="Selected date"
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 w-[138px] rounded-[9px] bg-transparent px-2 text-[13px] font-medium text-dark focus:outline-none"
          />
          <button onClick={next} aria-label="Next" className="grid h-8 w-8 place-items-center rounded-[9px] text-secondary transition-colors hover:bg-black/[0.04] hover:text-dark">
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        <Button size="sm" onClick={() => setSelectedDate(today())}><CalIcon size={16} strokeWidth={2} /> Today</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Calendar grid (month view simplified) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{view === 'month' ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : view === 'week' ? `Week of ${formatDate(weekDays(selectedDate)[0])}` : formatDateLong(selectedDate)}</CardTitle>
            <CardDescription>{dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} on {formatDate(selectedDate)}</CardDescription>
          </CardHeader>
          <CardContent>
            {view === 'month' && (
              <div className="grid grid-cols-7 gap-1 text-[11px]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="pb-1 text-center font-medium text-secondary">{d}</div>
                ))}
                {calendarDays(selectedDate).map((day) => {
                  const count = events.filter((e) => e.date === day.date).length;
                  const selected = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={!day.inMonth}
                      onClick={() => setSelectedDate(day.date)}
                      className={`group relative flex h-11 flex-col items-center justify-center rounded-[10px] text-[12.5px] transition-colors sm:h-12 ${
                        selected
                          ? 'bg-green-deep font-semibold text-white'
                          : day.isToday
                            ? 'bg-green-soft font-semibold text-green-deep'
                            : day.inMonth
                              ? 'text-dark hover:bg-black/[0.04]'
                              : 'cursor-default text-secondary/35'
                      }`}
                    >
                      <span>{day.day}</span>
                      {count > 0 && (
                        <span className={`mt-1 h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-green-deep'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'week' && (
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekDays(selectedDate).map((date) => {
                  const list = events.filter((e) => e.date === date);
                  const selected = date === selectedDate;
                  const d = new Date(date + 'T12:00:00');
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`flex min-h-[104px] flex-col rounded-xl border p-1.5 text-left transition-colors sm:p-2.5 ${
                        selected ? 'border-green-deep bg-green-soft/70' : 'border-border/70 bg-[#FBFDFB] hover:border-green-mint'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary">
                        {d.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <span className={`mt-0.5 text-[14px] font-semibold ${selected ? 'text-green-deep' : 'text-dark'}`}>{d.getDate()}</span>
                      <span className="mt-1.5 space-y-0.5">
                        {list.slice(0, 2).map((e) => (
                          <span key={`${e.type}-${e.recordId}`} className="flex items-center gap-1 text-[9.5px] leading-tight text-secondary">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                            <span className="truncate">{e.type}</span>
                          </span>
                        ))}
                        {list.length > 2 && <span className="block text-[9.5px] font-medium text-secondary">+{list.length - 2} more</span>}
                        {list.length === 0 && <span className="block text-[9.5px] text-secondary/50">—</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'day' && (
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
                <div className="flex items-center gap-4 rounded-2xl bg-green-soft/70 px-5 py-4">
                  <span className="stat-number text-[40px] font-semibold leading-none text-green-deep">{new Date(selectedDate + 'T12:00:00').getDate()}</span>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-green-deep">{new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'long' })}</p>
                    <p className="text-[12.5px] text-secondary">{new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {dayTypeCounts(dayEvents).length ? dayTypeCounts(dayEvents).map((t) => (
                    <div key={t.type} className="rounded-xl border border-border/70 bg-[#FBFDFB] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{t.type}</p>
                      <p className="stat-number mt-1 text-[18px] font-semibold text-dark">{t.count}</p>
                    </div>
                  )) : (
                    <p className="col-span-full rounded-xl border border-dashed border-border bg-[#FBFDFB] px-4 py-8 text-center text-[12.5px] text-secondary">
                      No records on this day.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/70 pt-4 text-[11.5px] text-secondary">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-deep" /> Activity logged</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-soft ring-1 ring-green-mint" /> Today</span>
              <span className="ml-auto">{events.length} total records</span>
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card className="lg:col-span-1 self-start">
          <CardHeader>
            <div>
              <CardTitle>{formatDateLong(selectedDate)}</CardTitle>
              <CardDescription>{dayEvents.length ? `${dayEvents.length} ${dayEvents.length === 1 ? 'record' : 'records'} logged` : 'Activity summary'}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {dayEvents.length ? (
                dayEvents.map((e) => (
                  <div key={`${e.date}-${e.type}-${e.recordId}`} className="flex items-center gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-3 py-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-dark">{e.title}</span>
                    <span className="shrink-0 rounded-full border border-border/70 bg-white px-2 py-0.5 text-[10.5px] font-medium capitalize text-secondary">{e.type}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#FBFDFB] px-4 py-10 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft text-green-deep">
                    <CalIcon size={18} strokeWidth={1.8} />
                  </span>
                  <p className="mt-3 text-[13px] font-medium text-dark">Nothing recorded</p>
                  <p className="mt-1 max-w-[220px] text-[11.5px] leading-relaxed text-secondary">Pick another day or log weight, meals or workouts to fill your timeline.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function weekDays(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    const start = new Date(d);
    start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    });
  }

  function dayTypeCounts(list: any[]) {
    const counts = new Map<string, number>();
    list.forEach((e) => counts.set(e.type, (counts.get(e.type) || 0) + 1));
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }

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
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateLong(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
}
