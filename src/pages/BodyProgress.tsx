/**
 * Body Progress — Weight tracker, measurements, composition, BMI calculator.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { convertWeight, convertMeasurement, formatWeight, formatMeasurement, today, type BodyMeasurement, type WeightUnit, type MeasurementUnit } from '../types';
import { weightStats } from '../services/calculations';
import { Plus, Ruler, Edit2, Trash2, Calculator, Scale } from 'lucide-react';
import { success, error } from '../services/toast';

const MEASURE_TYPES: Array<{ value: BodyMeasurement['type']; label: string }> = [
  { value: 'waist', label: 'Waist' },
  { value: 'hips', label: 'Hips' },
  { value: 'chest', label: 'Chest' },
  { value: 'neck', label: 'Neck' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'leftArm', label: 'Left Arm' },
  { value: 'rightArm', label: 'Right Arm' },
  { value: 'leftThigh', label: 'Left Thigh' },
  { value: 'rightThigh', label: 'Right Thigh' },
  { value: 'leftCalf', label: 'Left Calf' },
  { value: 'rightCalf', label: 'Right Calf' },
  { value: 'custom', label: 'Custom' },
];

type Tab = 'weight' | 'measurements' | 'composition' | 'bmi';

const TAB_LABELS: Record<Tab, string> = {
  weight: 'Weight',
  measurements: 'Measurements',
  composition: 'Composition',
  bmi: 'BMI',
};

export function BodyProgress() {
  const [tab, setTab] = React.useState<Tab>('weight');
  const [weightEntries, setWeightEntries] = React.useState<any[]>([]);
  const [measurements, setMeasurements] = React.useState<any[]>([]);
  const [compositions, setCompositions] = React.useState<any[]>([]);
  const [selectedMeasureType, setSelectedMeasureType] = React.useState<BodyMeasurement['type']>('waist');
  const [profile, setProfile] = React.useState<any>(null);
  const [compositionForm, setCompositionForm] = React.useState({
    date: today(), bodyFatPercent: '', muscleMassKg: '', waterPercent: '', boneMassKg: '',
  });

  // modals
  const [addWeightOpen, setAddWeightOpen] = React.useState(false);
  const [editWeightId, setEditWeightId] = React.useState<string | null>(null);
  const [addMeasureOpen, setAddMeasureOpen] = React.useState(false);

  // forms
  const [weightForm, setWeightForm] = React.useState({ date: today(), weight: '', unit: 'kg', notes: '' });
  const [measureForm, setMeasureForm] = React.useState({ date: today(), type: 'waist', customLabel: '', value: '', unit: 'cm', notes: '' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [w, m, p, c] = await Promise.all([db.weight.list(), db.bodyMeasurements.list(), db.profile.get(), db.bodyCompositions.list()]);
      if (!mounted) return;
      setWeightEntries(w);
      setMeasurements(m);
      setProfile(p);
      setCompositions(c);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const stats = weightStats(weightEntries, profile?.preferredWeightUnit || 'kg');

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editWeightId) {
        await db.weight.update(editWeightId, {
          date: weightForm.date,
          weight: parseFloat(weightForm.weight),
          unit: weightForm.unit as WeightUnit,
          notes: weightForm.notes || undefined,
        });
        success('Weight updated');
      } else {
        await db.weight.add({
          date: weightForm.date,
          weight: parseFloat(weightForm.weight),
          unit: weightForm.unit as WeightUnit,
          notes: weightForm.notes || undefined,
        });
        success('Weight logged');
      }
      setAddWeightOpen(false);
      setEditWeightId(null);
      setWeightForm({ date: today(), weight: '', unit: 'kg', notes: '' });
      const w = await db.weight.list();
      setWeightEntries(w);
    } catch (err) {
      error('Failed to save weight', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteWeight = async (id: string) => {
    if (!window.confirm('Delete this weight record?')) return;
    await db.weight.remove(id);
    const w = await db.weight.list();
    setWeightEntries(w);
    success('Deleted');
  };

  const handleMeasureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.bodyMeasurements.add({
        date: measureForm.date,
        type: measureForm.type as any,
        customLabel: measureForm.customLabel || undefined,
        value: parseFloat(measureForm.value),
        unit: measureForm.unit as MeasurementUnit,
        notes: measureForm.notes || undefined,
      });
      setAddMeasureOpen(false);
      setMeasureForm({ date: today(), type: 'waist', customLabel: '', value: '', unit: 'cm', notes: '' });
      const m = await db.bodyMeasurements.list();
      setMeasurements(m);
      success('Measurement saved');
    } catch (err) {
      error('Failed to save measurement', err instanceof Error ? err.message : String(err));
    }
  };

  const deleteMeasure = async (id: string) => {
    if (!window.confirm('Delete this measurement?')) return;
    await db.bodyMeasurements.remove(id);
    const m = await db.bodyMeasurements.list();
    setMeasurements(m);
    success('Deleted');
  };

  const convertEntry = (entry: any, toUnit: 'kg' | 'lb' | 'st') =>
    convertWeight(entry.weight, entry.unit, toUnit);

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-dark sm:text-[30px]">Body Progress</h1>
        <Button variant="outline" onClick={() => setAddWeightOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Log Weight
        </Button>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="inline-flex min-w-max gap-1 rounded-control border border-border bg-white p-1 shadow-card sm:w-auto">
          {(['weight', 'measurements', 'composition', 'bmi'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium transition-colors sm:px-3.5 ${
              tab === t
                ? 'bg-green-soft text-green-deep'
                : 'text-secondary hover:bg-black/[0.03] hover:text-dark'
            }`}
          >
            {t === 'weight' && <Scale size={14} strokeWidth={2} className="hidden sm:block" />}
            {t === 'measurements' && <Ruler size={14} strokeWidth={2} className="hidden sm:block" />}
            {t === 'composition' && <Calculator size={14} strokeWidth={2} className="hidden sm:block" />}
            {t === 'bmi' && <Calculator size={14} strokeWidth={2} className="hidden sm:block" />}
            {TAB_LABELS[t]}
          </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardSmall title="Current weight" value={stats.current != null ? formatWeight(stats.current, profile?.preferredWeightUnit || 'kg') : '—'} sub="Latest entry" />
        <StatCardSmall title="Start weight" value={stats.start != null ? formatWeight(stats.start, profile?.preferredWeightUnit || 'kg') : '—'} sub="First entry" />
        <StatCardSmall title="Change" value={stats.change != null ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)}` : '—'} sub={`vs start · ${stats.count} ${stats.count === 1 ? 'record' : 'records'}`} />
      </div>

      {tab === 'weight' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Weight history</CardTitle>
                <CardDescription>Last 30 records · shown in {profile?.preferredWeightUnit || 'kg'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {weightEntries.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData(weightEntries, profile?.preferredWeightUnit || 'kg')} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bodyWeightFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#169C5C" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#169C5C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E7F0E9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} dy={10} minTickGap={28} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tick={{ fill: '#7A8B80', fontSize: 11 }} width={44} />
                      <Tooltip content={<ChartTip format={(v: number) => formatWeight(v, profile?.preferredWeightUnit || 'kg')} />} />
                      <Area type="monotone" dataKey="value" stroke="#0F8A4F" strokeWidth={2.5} fill="url(#bodyWeightFill)" activeDot={{ r: 5, strokeWidth: 3, stroke: '#ffffff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#FBFDFB] text-center">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft text-green-deep"><Scale size={18} strokeWidth={1.8} /></span>
                    <p className="mt-3 text-[13px] font-medium text-dark">No weight records yet</p>
                    <p className="mt-1 max-w-[240px] text-[11.5px] leading-relaxed text-secondary">Log your first weight to start a trend.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent records</CardTitle>
                <CardDescription>Tap the pencil to edit or the bin to delete</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {weightEntries.slice(0, 10).map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="stat-number text-[13.5px] font-semibold text-dark">{formatWeight(convertEntry(e, profile?.preferredWeightUnit || 'kg'), profile?.preferredWeightUnit || 'kg')}</p>
                      <p className="mt-0.5 text-[12px] text-secondary">{formatShortDate(e.date)}{e.notes ? ` · ${e.notes}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => loadWeightForEdit(e)} title="Edit">
                        <Edit2 size={15} strokeWidth={2} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteWeight(e.id)} title="Delete">
                        <Trash2 size={15} strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                ))}
                {weightEntries.length === 0 && <p className="py-6 text-center text-[12.5px] text-secondary">No records yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'measurements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Body measurements</CardTitle>
                <CardDescription>Track waist, hips, chest and more</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddMeasureOpen(true)}>
                <Plus size={14} strokeWidth={2} /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {measurements.slice(0, 15).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-[#FBFDFB] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium capitalize text-dark">{m.customLabel || m.type}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-secondary">
                        <span>{formatShortDate(m.date)}</span>
                        <span>·</span>
                        <span>{m.unit}</span>
                        {m.notes && <span>· {m.notes}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="stat-number text-[13.5px] font-semibold text-green-deep">{formatMeasurement(convertMeasurement(m.value, m.unit, profile?.preferredMeasurementUnit || 'cm'), profile?.preferredMeasurementUnit || 'cm')}</span>
                      <Button variant="outline" size="sm" onClick={() => deleteMeasure(m.id)} title="Delete">
                        <Trash2 size={15} strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                ))}
                {measurements.length === 0 && <p className="py-6 text-center text-[12.5px] text-secondary">No measurements yet.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Measurement Trend</CardTitle>
              <CardDescription>Select a measurement type</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedMeasureType}
                options={MEASURE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                onChange={(v) => setSelectedMeasureType(v as BodyMeasurement['type'])}
                label="Measurement type"
              />
              <div className="mt-4 h-64">
                {measurementChartData().length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={measurementChartData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
                      <XAxis dataKey="date" stroke="#718078" fontSize={11} />
                      <YAxis stroke="#718078" fontSize={11} width={40} />
                      <Tooltip formatter={(v: number) => v.toFixed(1)} />
                      <Bar dataKey="value" fill="#2E9D59" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">
                    <p>No data for this type yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'composition' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Record composition</CardTitle>
                <CardDescription>Self-reported estimates — not measured automatically</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveComposition} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Body fat %" type="number" step="0.1" value={compositionForm.bodyFatPercent} onChange={(e) => setCompositionForm({ ...compositionForm, bodyFatPercent: e.target.value })} placeholder="e.g. 22" />
                  <Input label="Muscle mass (kg)" type="number" step="0.1" value={compositionForm.muscleMassKg} onChange={(e) => setCompositionForm({ ...compositionForm, muscleMassKg: e.target.value })} placeholder="e.g. 60" />
                  <Input label="Body water %" type="number" step="0.1" value={compositionForm.waterPercent} onChange={(e) => setCompositionForm({ ...compositionForm, waterPercent: e.target.value })} placeholder="e.g. 55" />
                  <Input label="Bone mass (kg)" type="number" step="0.1" value={compositionForm.boneMassKg} onChange={(e) => setCompositionForm({ ...compositionForm, boneMassKg: e.target.value })} placeholder="e.g. 3" />
                </div>
                <Input label="Date" type="date" value={compositionForm.date} onChange={(e) => setCompositionForm({ ...compositionForm, date: e.target.value })} />
                <Button type="submit" className="w-full sm:w-auto">Save composition reading</Button>
                <p className="text-[12px] leading-relaxed text-secondary">These values are for your personal reference only and are not diagnostic.</p>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Saved readings</CardTitle>
                <CardDescription>{compositions.length} {compositions.length === 1 ? 'entry' : 'entries'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {compositions.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border/70 bg-[#FBFDFB] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] font-medium text-dark">{formatShortDate(c.date)}</p>
                      <Button variant="outline" size="sm" onClick={() => deleteComposition(c.id)} title="Delete">
                        <Trash2 size={14} strokeWidth={2} />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.bodyFatPercent != null && <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green-deep">Fat {Number(c.bodyFatPercent).toFixed(1)}%</span>}
                      {c.muscleMassKg != null && <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green-deep">Muscle {Number(c.muscleMassKg).toFixed(1)} kg</span>}
                      {c.waterPercent != null && <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green-deep">Water {Number(c.waterPercent).toFixed(1)}%</span>}
                      {c.boneMassKg != null && <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green-deep">Bone {Number(c.boneMassKg).toFixed(1)} kg</span>}
                    </div>
                  </div>
                ))}
                {compositions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-[#FBFDFB] px-4 py-10 text-center">
                    <p className="text-[13px] font-medium text-dark">No readings saved</p>
                    <p className="mt-1 text-[12px] text-secondary">Your saved body composition entries will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'bmi' && (
        <Card>
          <CardHeader>
            <CardTitle>BMI Calculator</CardTitle>
            <CardDescription>Body Mass Index — informational only.</CardDescription>
          </CardHeader>
          <CardContent>
            <BMICalculator profile={profile} />
          </CardContent>
        </Card>
      )}

      {addWeightOpen && (
        <Modal open={addWeightOpen} onClose={() => setAddWeightOpen(false)} title={editWeightId ? 'Edit Weight' : 'Log Weight'} description="Enter your weight and unit.">
          <form onSubmit={handleWeightSubmit} className="space-y-4">
            <Input label="Date" type="date" value={weightForm.date} onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Weight" type="number" value={weightForm.weight} onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })} placeholder="e.g. 72.5" />
              <Select value={weightForm.unit} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }, { value: 'st', label: 'st' }]} onChange={(v) => setWeightForm({ ...weightForm, unit: v })} label="Unit" />
            </div>
            <Input label="Notes (optional)" value={weightForm.notes} onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddWeightOpen(false)}>Cancel</Button>
              <Button type="submit">{editWeightId ? 'Save Changes' : 'Log Weight'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {addMeasureOpen && (
        <Modal open={addMeasureOpen} onClose={() => setAddMeasureOpen(false)} title="Add Measurement" description="Select type, enter value and unit.">
          <form onSubmit={handleMeasureSubmit} className="space-y-4">
            <Input label="Date" type="date" value={measureForm.date} onChange={(e) => setMeasureForm({ ...measureForm, date: e.target.value })} />
            <Select value={measureForm.type} options={MEASURE_TYPES.map((t) => ({ value: t.value, label: t.label }))} onChange={(v) => setMeasureForm({ ...measureForm, type: v as any, customLabel: v === 'custom' ? '' : measureForm.customLabel })} label="Type" />
            {measureForm.type === 'custom' && <Input label="Custom label" value={measureForm.customLabel} onChange={(e) => setMeasureForm({ ...measureForm, customLabel: e.target.value })} placeholder="e.g. Biceps" />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Value" type="number" value={measureForm.value} onChange={(e) => setMeasureForm({ ...measureForm, value: e.target.value })} placeholder="e.g. 84" />
              <Select value={measureForm.unit} options={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'in' }]} onChange={(v) => setMeasureForm({ ...measureForm, unit: v })} label="Unit" />
            </div>
            <Input label="Notes (optional)" value={measureForm.notes} onChange={(e) => setMeasureForm({ ...measureForm, notes: e.target.value })} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddMeasureOpen(false)}>Cancel</Button>
              <Button type="submit">Save Measurement</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );

  async function saveComposition(e: React.FormEvent) {
    e.preventDefault();
    const bodyFatPercent = compositionForm.bodyFatPercent ? parseFloat(compositionForm.bodyFatPercent) : undefined;
    const muscleMassKg = compositionForm.muscleMassKg ? parseFloat(compositionForm.muscleMassKg) : undefined;
    const waterPercent = compositionForm.waterPercent ? parseFloat(compositionForm.waterPercent) : undefined;
    const boneMassKg = compositionForm.boneMassKg ? parseFloat(compositionForm.boneMassKg) : undefined;
    if ([bodyFatPercent, muscleMassKg, waterPercent, boneMassKg].every((v) => v == null || Number.isNaN(v))) {
      error('Enter at least one composition value');
      return;
    }
    try {
      await db.bodyCompositions.add({ date: compositionForm.date, bodyFatPercent, muscleMassKg, waterPercent, boneMassKg });
      setCompositionForm({ date: today(), bodyFatPercent: '', muscleMassKg: '', waterPercent: '', boneMassKg: '' });
      const c = await db.bodyCompositions.list();
      setCompositions(c);
      success('Composition reading saved');
    } catch (err) {
      error('Failed to save reading', err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteComposition(id: string) {
    if (!window.confirm('Delete this composition reading?')) return;
    await db.bodyCompositions.remove(id);
    const c = await db.bodyCompositions.list();
    setCompositions(c);
    success('Deleted');
  }

  function measurementChartData() {
    return measurements
      .filter((m) => m.type === selectedMeasureType)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .slice(-30)
      .map((m) => ({ date: m.date.slice(5), value: convertMeasurement(m.value, m.unit, profile?.preferredMeasurementUnit || 'cm') }));
  }

  async function loadWeightForEdit(e: any) {
    const current = await db.weight.get(e.id);
    if (!current) return;
    setEditWeightId(e.id);
    setWeightForm({ date: current.date, weight: current.weight.toString(), unit: current.unit, notes: current.notes || '' });
    setAddWeightOpen(true);
  }
}

function StatCardSmall({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card padding="none" className="flex min-h-[112px] flex-col justify-between p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">{title}</p>
        <p className="stat-number mt-2 text-2xl font-semibold leading-none text-dark">{value}</p>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-secondary">{sub}</p>
    </Card>
  );
}

function chartData(entries: any[], unit: WeightUnit) {
  return [...entries]
    .sort((a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-30)
    .map((e) => ({ date: formatShortDate(e.date), value: Math.round(convertWeight(e.weight, e.unit, unit) * 10) / 10 }));
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

interface BMICalculatorProps {
  profile: any;
}
function BMICalculator({ profile }: BMICalculatorProps) {
  const [weight, setWeight] = React.useState('');
  const [height, setHeight] = React.useState(profile?.heightCm ? profile.heightCm.toString() : '');
  const [result, setResult] = React.useState<{ bmi: number; label: string } | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) { setResult(null); return; }
    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    let label = '';
    if (bmi < 18.5) label = 'Underweight';
    else if (bmi < 25) label = 'Healthy weight';
    else if (bmi < 30) label = 'Overweight';
    else label = 'Obesity';
    setResult({ bmi, label });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Input label="Weight (kg)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <Input label="Height (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
        <Button onClick={calculate} className="w-full">Calculate BMI</Button>
      </div>
      <div className="space-y-4">
        {result ? (
          <div className="p-4 rounded-md border border-border bg-green-soft">
            <div className="text-2xl font-bold text-green-deep">{result.bmi}</div>
            <p className="text-dark">{result.label}</p>
            <p className="text-[12px] text-secondary mt-2">BMI is a screening estimate only, not a diagnosis or complete measure of health. It should not be used alone to set a weight target.</p>
          </div>
        ) : (
          <div className="text-secondary text-center py-8">Enter your values above.</div>
        )}
      </div>
    </div>
  );
}
