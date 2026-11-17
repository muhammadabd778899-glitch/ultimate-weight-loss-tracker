/**
 * Progress Photos — private local photo tracking.
 * Photos are stored in IndexedDB in your browser only. Nothing is uploaded.
 */

import * as React from 'react';
import { useEffect } from 'react';
// @ts-ignore
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
// @ts-ignore
import { Modal } from '../components/ui/Modal';
import { db } from '../db';
import { today } from '../types';
// @ts-ignore
import { Plus, CheckCircle2, Trash2, Image, RefreshCw } from 'lucide-react';
import { success, error } from '../services/toast';

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'other', label: 'Other' },
];

export function ProgressPhotos() {
  const [photos, setPhotos] = React.useState<any[]>([]);
  const [storageMB, setStorageMB] = React.useState(0);
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareIds, setCompareIds] = React.useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const p = await db.progressPhotos.list();
      if (!mounted) return;
      setPhotos(p);
      try {
        const quota = await navigator.storage?.estimate();
        const mb = quota ? Math.round((quota.usage || 0) / 1024 / 1024 * 100) / 100 : 0;
        setStorageMB(mb);
      } catch {}
    }
    load();
    return () => { mounted = false; };
  }, []);

  const deletePhoto = async (id: string) => {
    if (!window.confirm('Delete this photo?')) return;
    await db.progressPhotos.remove(id);
    const p = await db.progressPhotos.list();
    setPhotos(p);
    setCompareIds(compareIds.filter((cid) => cid !== id));
    success('Deleted');
  };

  const handleFile = async (file: File, date: string, notes: string, category: string) => {
    const base64 = await fileToDataUrl(file);
    try {
      await db.progressPhotos.add({
        date,
        notes,
        category: category as any,
        imageDataUrl: base64,
        fileName: file.name,
        fileSize: file.size,
      });
      const p = await db.progressPhotos.list();
      setPhotos(p);
      success('Photo saved');
    } catch (err) {
      error('Failed to save photo', err instanceof Error ? err.message : String(err));
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setCompareMode(compareIds.length >= 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-deep-green font-bold text-2xl">Progress Photos</h1>
        <Button onClick={() => setCompareMode(false)} size="sm">
          <RefreshCw size={16} strokeWidth={2} /> Clear Comparison
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardSmall title="Photos" value={photos.length} sub="stored locally" />
        <StatCardSmall title="Storage" value={`${storageMB} MB`} sub="IndexedDB quota" />
        <StatCardSmall title="Compare" value={compareIds.length} sub="selected" />
        <StatCardSmall title="Private" value="Yes" sub="device only" />
      </div>

      <div className="border border-border rounded-lg p-4 bg-surface/50">
        <p className="text-[11px] text-secondary mb-3">Photos remain in your browser's local storage (IndexedDB). They are never uploaded to a server. This app does not analyze body images.</p>
        {storageMB > 50 && <div className="text-attention text-xs font-medium">Storage usage is high ({storageMB} MB). Consider exporting a backup or removing old photos.</div>}
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Add Photo</CardTitle>
          <CardDescription>Upload from your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <input type="file" accept="image/*" id="photo-upload" className="hidden" ref={React.createRef<HTMLInputElement>()} onChange={handleUploadChange} />
          <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-border bg-green-soft/50 text-green-deep hover:bg-green-mint transition-colors cursor-pointer" htmlFor="photo-upload">
            <Image size={32} strokeWidth={2} className="mb-1" />
            <p className="text-sm font-medium">Choose photo</p>
            <p className="text-[11px] text-secondary">JPEG or PNG</p>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Input label="Date" type="date" id="photo-date" defaultValue={today()} />
            <Select value="front" options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} onChange={() => {}} label="Category" />
          </div>
          <Input label="Notes (optional)" id="photo-notes" />
          <div className="flex justify-end mt-2">
            <Button disabled={!(document.getElementById('photo-upload') as HTMLInputElement)?.files?.length} onClick={doUpload} className="w-auto">
              Save Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison view */}
      {compareMode && compareIds.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare Photos</CardTitle>
            <CardDescription>Selected: {compareIds.length} photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {compareIds.map((id) => {
                const p = photos.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex flex-col gap-2">
                    <img src={p.imageDataUrl} alt="progress" className="w-full h-48 object-cover rounded-lg border border-border" />
                    <p className="text-[11px] text-secondary">{p.date}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Photo History ({photos.length})</CardTitle>
          <CardDescription>Tap a photo to add to comparison.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {photos.length ? (
              photos.map((p) => (
                <div key={p.id} className="relative group">
                  <div className="aspect-[1/1] rounded-lg overflow-hidden border border-border bg-green-soft relative">
                    <img src={p.imageDataUrl} alt="progress photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    {compareIds.includes(p.id) && (
                      <div className="absolute top-1 right-1 bg-green-deep text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px]">
                        <CheckCircle2 size={10} strokeWidth={2} fill="white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); toggleCompare(p.id); }} variant="ghost">
                        {compareIds.includes(p.id) ? 'Remove compare' : 'Compare'}
                      </Button>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); deletePhoto(p.id); }} variant="outline">
                        <Trash2 size={14} strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-secondary text-center mt-1">{p.date}</p>
                </div>
              ))
            ) : (
              <div className="text-secondary text-center py-10">
                <Image size={32} strokeWidth={1} className="mb-2 opacity-40" />
                <p>No photos yet. Add your first progress photo.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dateInput = document.getElementById('photo-date') as HTMLInputElement | null;
    const notesInput = document.getElementById('photo-notes') as HTMLInputElement | null;
    const categorySelect = document.querySelector('#photo-category') as HTMLSelectElement | null;
    handleFile(file, dateInput?.value || today(), notesInput?.value || '', categorySelect?.value || 'front');
  }

  async function doUpload() {
    const input = document.getElementById('photo-upload') as HTMLInputElement | null;
    if (!input?.files?.length) return;
    const dateInput = document.getElementById('photo-date') as HTMLInputElement | null;
    const notesInput = document.getElementById('photo-notes') as HTMLInputElement | null;
    await handleFile(input.files[0], dateInput?.value || today(), notesInput?.value || '', 'front');
    input.value = '';
    (document.getElementById('photo-notes') as HTMLInputElement).value = '';
    success('Photo saved');
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatCardSmall({ title, value, sub }: { title: string; value: string | number; sub: string }) {
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
