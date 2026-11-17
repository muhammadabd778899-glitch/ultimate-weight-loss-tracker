/**
 * Body Progress — Weight tracker, measurements, composition, BMI calculator.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
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

export function BodyProgress() {
  const [tab, setTab] = React.useState<Tab>('weight');
  const [weightEntries, setWeightEntries] = React.useState<any[]>([]);
  const [measurements, setMeasurements] = React.useState<any[]>([]);
  const [selectedMeasureType, setSelectedMeasureType] = React.useState<BodyMeasurement['type']>('waist');
  const [profile, setProfile] = React.useState<any>(null);

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
      const [w, m, p] = await Promise.all([db.weight.list(), db.bodyMeasurements.list(), db.profile.get()]);
      if (!mounted) return;
      setWeightEntries(w);
      setMeasurements(m);
      setProfile(p);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Body Progress</h1>
        <Button variant="outline" onClick={() => setAddWeightOpen(true)} size="sm">
          <Plus size={16} strokeWidth={2} /> Log Weight
        </Button>
      </div>

      <div className="flex gap-2 rounded-md border border-border bg-surface">
        {(['weight', 'measurements', 'composition', 'bmi'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? 'bg-green-soft text-green-deep'
                : 'text-secondary hover:text-green-deep hover:bg-green-soft/50'
            }`}
          >
            {t === 'weight' && <Scale size={14} strokeWidth={2} className="mr-1" />}
            {t === 'measurements' && <Ruler size={14} strokeWidth={2} className="mr-1" />}
            {t === 'composition' && <Calculator size={14} strokeWidth={2} className="mr-1" />}
            {t === 'bmi' && <Calculator size={14} strokeWidth={2} className="mr-1" />}
            {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardSmall title="Current Weight" value={stats.current != null ? formatWeight(stats.current, profile?.preferredWeightUnit || 'kg') : '—'} sub="Current" />
        <StatCardSmall title="Start Weight" value={stats.start != null ? formatWeight(stats.start, profile?.preferredWeightUnit || 'kg') : '—'} sub="Starting" />
        <StatCardSmall title="Change" value={stats.change != null ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)}` : '—'} sub={`vs start · ${stats.count} records`} />
      </div>

      {tab === 'weight' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
              <CardDescription>Last 30 records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {weightEntries.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData(weightEntries, profile?.preferredWeightUnit || 'kg')}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EDE6" />
                      <XAxis dataKey="date" stroke="#718078" fontSize={11} />
                      <YAxis stroke="#718078" fontSize={11} width={40} />
                      <Tooltip formatter={(v: number) => formatWeight(v, profile?.preferredWeightUnit || 'kg')} />
                      <Line type="monotone" dataKey="value" stroke="#2E9D59" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-secondary text-center py-10">
                    <Scale size={40} strokeWidth={1} className="mb-2 opacity-30" />
                    <p>No weight records yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Records</CardTitle>
              <CardDescription>Tap to edit or delete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {weightEntries.slice(0, 10).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-md hover:bg-green-soft/50">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark">{e.date}</span>
                        <span className="text-green-deep font-semibold">{formatWeight(convertEntry(e, profile?.preferredWeightUnit || 'kg'), profile?.preferredWeightUnit || 'kg')}</span>
                      </div>
                      {e.notes && <p className="text-[11px] text-secondary">{e.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => loadWeightForEdit(e)} title="Edit">
                        <Edit2 size={16} strokeWidth={2} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteWeight(e.id)} title="Delete">
                        <Trash2 size={16} strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                ))}
                {weightEntries.length === 0 && <div className="text-secondary text-xs text-center py-4">No records</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'measurements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Body Measurements</CardTitle>
                <CardDescription>Track waist, hips, chest and more</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddMeasureOpen(true)}>
                <Plus size={14} strokeWidth={2} /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {measurements.slice(0, 15).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-md hover:bg-green-soft/50">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark">{m.customLabel || m.type}</span>
                        <span className="text-green-deep font-semibold">{formatMeasurement(convertMeasurement(m.value, m.unit, profile?.preferredMeasurementUnit || 'cm'), profile?.preferredMeasurementUnit || 'cm')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-secondary">
                        <span>{m.date}</span>
                        <span className="mx-1">·</span>
                        <span>{m.unit}</span>
                        {m.notes && <span>· {m.notes}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteMeasure(m.id)} title="Delete">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                ))}
                {measurements.length === 0 && <div className="text-secondary text-xs text-center py-6">No measurements yet.</div>}
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
        <Card>
          <CardHeader>
            <CardTitle>Body Composition</CardTitle>
            <CardDescription>Manually record body fat, muscle mass, and more.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-secondary text-sm">Body composition values are self-reported estimates. This app does not measure body composition automatically.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Body Fat %" type="number" placeholder="e.g. 22" />
                <Input label="Muscle Mass (kg)" type="number" placeholder="e.g. 60" />
                <Input label="Body Water %" type="number" placeholder="e.g. 55" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Bone Mass (kg)" type="number" placeholder="e.g. 3" />
                <Input label="Date" type="date" defaultValue={today()} />
              </div>
              <Button>Save Composition Reading</Button>
              <p className="text-[11px] text-secondary mt-2">These values are for your personal reference only and are not diagnostic.</p>
            </div>
          </CardContent>
        </Card>
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
    <Card className="h-24 flex flex-col justify-between p-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-secondary">{title}</p>
        <p className="text-deep-green font-bold text-lg">{value}</p>
      </div>
      <p className="text-[10px] text-secondary">{sub}</p>
    </Card>
  );
}

function chartData(entries: any[], unit: WeightUnit) {
  return entries
    .sort((a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-30)
    .map((e) => ({ date: e.date.slice(5), value: convertWeight(e.weight, e.unit, unit) }));
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
            <p className="text-[11px] text-secondary mt-2">BMI is a screening estimate only, not a diagnosis or complete measure of health. It should not be used alone to set a weight target.</p>
          </div>
        ) : (
          <div className="text-secondary text-center py-8">Enter your values above.</div>
        )}
      </div>
    </div>
  );
}
