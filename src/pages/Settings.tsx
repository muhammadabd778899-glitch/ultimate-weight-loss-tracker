import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { db } from '../db';
import { generateDemoData } from '../services/demo-data';
import { exportJSON, backupToJsonString, validateBackup, importJSON, downloadJson } from '../services/export-import';
import { Upload, Download, Trash2, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { success, error } from '../services/toast';
import { UserProfile } from '../types';

export function Settings() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = React.useState({
    displayName: '', heightCm: '', preferredWeightUnit: 'kg', preferredMeasurementUnit: 'cm',
    dateFormat: 'YYYY-MM-DD', weekStart: '1', currency: 'USD', dailyWaterTargetMl: '',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const p = await db.profile.get();
      if (!mounted) return;
      setProfile(p);
      setProfileForm({
        displayName: p?.displayName || '',
        heightCm: p?.heightCm?.toString() || '',
        preferredWeightUnit: p?.preferredWeightUnit || 'kg',
        preferredMeasurementUnit: p?.preferredMeasurementUnit || 'cm',
        dateFormat: p?.dateFormat || 'YYYY-MM-DD',
        weekStart: String(p?.weekStart || 1),
        currency: p?.currency || 'USD',
        dailyWaterTargetMl: p?.dailyWaterTargetMl?.toString() || '',
      });
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.profile.save({
        displayName: profileForm.displayName || 'User',
        heightCm: profileForm.heightCm ? Number(profileForm.heightCm) : undefined,
        preferredWeightUnit: profileForm.preferredWeightUnit as UserProfile['preferredWeightUnit'],
        preferredMeasurementUnit: profileForm.preferredMeasurementUnit as UserProfile['preferredMeasurementUnit'],
        dateFormat: profileForm.dateFormat as UserProfile['dateFormat'],
        weekStart: Number(profileForm.weekStart) as UserProfile['weekStart'],
        currency: profileForm.currency as UserProfile['currency'],
        dailyWaterTargetMl: profileForm.dailyWaterTargetMl ? Number(profileForm.dailyWaterTargetMl) : 2000,
        demoMode: profile?.demoMode ?? false,
        onboardingCompleted: true,
      });
      const p = await db.profile.get();
      setProfile(p);
      success('Settings saved');
    } catch (err) {
      error('Failed to save', err instanceof Error ? err.message : String(err));
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportJSON();
      const json = backupToJsonString(data);
      downloadJson(`ultimate-weight-loss-backup-${new Date().toISOString().slice(0, 10)}.json`, json);
      success('Backup exported');
    } catch (err) {
      error('Export failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleImportFile = async (file: File) => {
    const text = await fileToText(file);
    const validation = validateBackup(text);
    if (!validation.valid) {
      error('Invalid backup', validation.error);
      return;
    }
    const totalRecords = (validation.summary && Object.values(validation.summary as { [k: string]: number }).reduce((acc: number, val: number) => acc + val, 0)) || 0;
    const ok = window.confirm(`Restore backup with ${totalRecords} records? This will REPLACE all current data.`);
    if (!ok) return;
    try {
      const result = await importJSON(text);
      if (result.ok) {
        success('Backup restored');
        window.location.reload();
      } else {
        error('Restore failed', result.error);
      }
    } catch (err) {
      error('Restore failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleLoadDemo = async () => {
    const ok = window.confirm('Load demo data? This will REPLACE all your current data with fictional sample records.');
    if (!ok) return;
    try {
      const demo = generateDemoData();
      await db.importAll({ ...demo, schemaVersion: 1, exportedAt: new Date().toISOString() } as any);
      await db.profile.save({ ...demo.profile } as any);
      await db.settings.save({ ...demo.settings } as any);
      success('Demo data loaded');
      window.location.reload();
    } catch (err) {
      error('Demo load failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleClearAll = async () => {
    const ok = window.confirm('CLEAR ALL DATA? This cannot be undone. Export a backup first if you want to keep your records.');
    if (!ok) return;
    try {
      await db.profile.save({ displayName: 'User', preferredWeightUnit: 'kg', preferredMeasurementUnit: 'cm', dateFormat: 'YYYY-MM-DD', weekStart: 1, currency: 'USD', dailyWaterTargetMl: 2000, demoMode: false, onboardingCompleted: true });
      await db.settings.save({ preferredDashboardMetrics: [], customFoodCategories: [], customWorkoutCategories: [], customHabits: [], notificationsEnabled: true, reducedMotion: false });
      await db.clear('weightEntries'); await db.clear('bodyMeasurements'); await db.clear('bodyCompositions');
      await db.clear('foodItems'); await db.clear('mealEntries'); await db.clear('recipes'); await db.clear('mealPlans');
      await db.clear('groceryItems'); await db.clear('workoutSessions'); await db.clear('workoutExercises'); await db.clear('exerciseLibrary'); await db.clear('workoutPlans');
      await db.clear('habits'); await db.clear('habitEntries'); await db.clear('sleepEntries'); await db.clear('waterEntries');
      await db.clear('goals'); await db.clear('milestones'); await db.clear('challenges'); await db.clear('challengeEntries');
      await db.clear('progressPhotos'); await db.clear('journalEntries'); await db.clear('achievements'); await db.clear('calendarEvents');
      success('All personal data cleared');
      window.location.reload();
    } catch (err) {
      error('Clear failed', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Settings</h1>
        <Button size="sm"><SettingsIcon size={16} strokeWidth={2} /></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile & Preferences</CardTitle>
          <CardDescription>Your personal details and units.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Display name" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} />
              <Input label="Height (cm)" type="number" value={profileForm.heightCm} onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })} />
              <Input label="Daily water target (ml)" type="number" value={profileForm.dailyWaterTargetMl} onChange={(e) => setProfileForm({ ...profileForm, dailyWaterTargetMl: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={profileForm.preferredWeightUnit} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }, { value: 'st', label: 'st' }]} onChange={(v) => setProfileForm({ ...profileForm, preferredWeightUnit: v })} label="Weight unit" />
              <Select value={profileForm.preferredMeasurementUnit} options={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'in' }]} onChange={(v) => setProfileForm({ ...profileForm, preferredMeasurementUnit: v })} label="Measurement unit" />
              <Select value={profileForm.dateFormat} options={[{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }, { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }]} onChange={(v) => setProfileForm({ ...profileForm, dateFormat: v })} label="Date format" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={profileForm.currency} options={['USD','EUR','GBP','CAD','AUD','INR'].map((c) => ({ value: c, label: c }))} onChange={(v) => setProfileForm({ ...profileForm, currency: v })} label="Currency" />
              <Select value={profileForm.weekStart} options={[{ value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }, { value: '6', label: 'Saturday' }]} onChange={(v) => setProfileForm({ ...profileForm, weekStart: v })} label="Week starts on" />
            </div>
            <Button type="submit" className="w-auto">Save Profile</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Data Backup & Restore</CardTitle>
          <CardDescription>JSON export/import of all your local records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark">Export backup</p>
                <p className="text-[11px] text-secondary">Download all records as JSON. Includes settings and image data references.</p>
              </div>
              <Button onClick={handleExport} size="sm"><Download size={16} strokeWidth={2} /> Export</Button>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium text-dark">Import backup</p>
                <p className="text-[11px] text-secondary">Replace current data from a JSON backup file.</p>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface p-2 cursor-pointer text-sm">
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files![0])} />
                <Upload size={16} strokeWidth={2} /> Choose file
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Demo Mode</CardTitle>
          <CardDescription>Fictional sample data to explore the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-green-soft/50">
              <p className="text-[11px] text-secondary mb-2">Demo mode loads realistic fictional data (60 days of weights, meals, workouts, habits, recipes, and more) so you can explore every module.</p>
              <Button onClick={handleLoadDemo} size="sm" className="w-auto">
                <RefreshCw size={16} strokeWidth={2} /> Load Demo Data
              </Button>
            </div>
            <div className="p-4 rounded-lg border border-border bg-attention/20">
              <p className="text-[11px] text-attention font-medium mb-2">⚠ Destructive action</p>
              <Button onClick={handleClearAll} variant="outline" size="sm" className="w-auto text-attention border-attention hover:bg-attention/10">
                <Trash2 size={16} strokeWidth={2} /> Clear All Personal Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Health & Safety</CardTitle>
          <CardDescription>This app is a personal tracking tool, not a medical device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[11px] text-secondary text-sm">"This application is designed for personal fitness, nutrition, and wellness tracking. It does not provide medical advice, diagnosis, or treatment. Calculations and nutrition values are estimates and may be inaccurate. Consult a qualified healthcare professional before making health-related changes, especially if you have a medical condition, are pregnant, are under 18, or have specific dietary or exercise needs."</p>
            <p className="text-[11px] text-secondary mt-2">BMI is informational only. Estimated exercise calories are not exact. Targets are editable and never prescribed. Body measurements and photos are optional.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsText(file);
  });
}