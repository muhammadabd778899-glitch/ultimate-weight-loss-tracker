/**
 * Wellness Journal — personal reflection log.
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { SearchFilter } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { Plus, Book, Trash2, Edit2 } from 'lucide-react';
import { success, error } from '../services/toast';
import { today } from '../types';

export function Journal() {
  const [entries, setEntries] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');

  const [addOpen, setAddOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    date: today(), mood: 3, energy: 3, sleepQuality: 3, reflection: '', wins: '', challenges: '', notes: '',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const e = await db.journal.list();
      if (!mounted) return;
      setEntries(e);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = entries.filter((e) => {
    const s = search.toLowerCase();
    return e.reflection.toLowerCase().includes(s) || e.wins.toLowerCase().includes(s) || e.challenges.toLowerCase().includes(s) || e.date.includes(s);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mood = Number(form.mood) as 1 | 2 | 3 | 4 | 5;
      const energy = Number(form.energy) as 1 | 2 | 3 | 4 | 5;
      const sleepQuality = Number(form.sleepQuality) as 1 | 2 | 3 | 4 | 5;
      if (editId) {
        await db.journal.update(editId, { ...form, mood, energy, sleepQuality });
        success('Entry updated');
      } else {
        await db.journal.add({ ...form, mood, energy, sleepQuality });
        success('Entry saved');
      }
      setAddOpen(false);
      setEditId(null);
      setForm({ date: today(), mood: 3, energy: 3, sleepQuality: 3, reflection: '', wins: '', challenges: '', notes: '' });
      const e = await db.journal.list();
      setEntries(e);
    } catch (err) {
      error('Failed to save entry', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Delete this journal entry?')) return;
    await db.journal.remove(id);
    const e = await db.journal.list();
    setEntries(e);
    success('Deleted');
  };

  const loadForEdit = async (id: string) => {
    const e = await db.journal.get(id);
    if (!e) return;
    setEditId(e.id);
    setForm({ date: e.date, mood: e.mood, energy: e.energy, sleepQuality: e.sleepQuality, reflection: e.reflection || '', wins: e.wins || '', challenges: e.challenges || '', notes: e.notes || '' });
    setAddOpen(true);
  };

  const moodAvg = entries.length ? Math.round((entries.reduce((s, e) => s + e.mood, 0) / entries.length) * 10) / 10 : 0;

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Wellness Journal</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> New Entry
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCardSmall title="Entries" value={entries.length} sub="total" />
        <StatCardSmall title="Avg mood" value={entries.length ? `${moodAvg}/5` : '—'} sub="across all entries" />
        <StatCardSmall title="Last entry" value={entries.length ? formatDateLong(entries[0].date) : '—'} sub="most recent" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchFilter onSearch={setSearch} placeholder="Search reflections, wins, challenges..." />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Entries ({filtered.length})</CardTitle>
          <CardDescription>Keep the language encouraging and neutral.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.length ? (
              filtered.map((e) => (
                <div key={e.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] p-3.5 transition-colors hover:border-green-mint/60 sm:flex-row sm:items-start sm:justify-between" onClick={() => loadForEdit(e.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-medium text-dark">{formatDateLong(e.date)}</span>
                      <span className="rounded-full bg-green-soft/80 px-2 py-0.5 text-[10.5px] font-medium text-green-deep">Mood {e.mood}/5</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-secondary">
                      <span>Energy {e.energy}/5</span>
                      <span>·</span>
                      <span>Sleep {e.sleepQuality}/5</span>
                    </div>
                    {e.reflection && <p className="mt-2 text-[12.5px] leading-relaxed text-dark">{e.reflection}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); loadForEdit(e.id); }} title="Edit">
                      <Edit2 size={15} strokeWidth={2} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }} title="Delete">
                      <Trash2 size={15} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-secondary text-center py-8">
                <Book size={32} strokeWidth={1} className="mb-2 opacity-40" />
                <p>No journal entries yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Edit Entry' : 'New Journal Entry'} description="Reflect on your day.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-secondary uppercase">Mood</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, mood: v })} className={`w-8 h-8 rounded-md text-xs font-medium border ${form.mood === v ? 'bg-green-deep text-white border-green-deep' : 'border-border text-secondary'}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-secondary uppercase">Energy</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, energy: v })} className={`w-8 h-8 rounded-md text-xs font-medium border ${form.energy === v ? 'bg-green-deep text-white border-green-deep' : 'border-border text-secondary'}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-secondary uppercase">Sleep Quality</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, sleepQuality: v })} className={`w-8 h-8 rounded-md text-xs font-medium border ${form.sleepQuality === v ? 'bg-green-deep text-white border-green-deep' : 'border-border text-secondary'}`}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
            <Textarea label="Daily reflection" value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} rows={2} placeholder="How did today feel?" />
            <Textarea label="Wins" value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value })} rows={2} placeholder="What went well?" />
            <Textarea label="Challenges" value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} rows={2} placeholder="What was tough?" />
            <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Save Entry' : 'Save Entry'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );

  function formatDateLong(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }
}

function StatCardSmall({ title, value, sub }: { title: string; value: string | number; sub: string }) {
  return (
    <Card padding="none" className="flex min-h-[112px] flex-col justify-between p-5">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-secondary">{title}</p>
        <p className="stat-number mt-2 text-xl font-semibold leading-tight text-dark">{value}</p>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-secondary">{sub}</p>
    </Card>
  );
}
