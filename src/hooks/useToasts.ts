import { useCallback, useEffect, useState } from 'react';
import { subscribe, getToasts, toast, dismiss, clearAll, type Toast, type ToastType } from '../services/toast';

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>(getToasts());

  useEffect(() => {
    setToasts(getToasts());
    const unsub = subscribe(setToasts);
    return unsub;
  }, []);

  const show = useCallback(({ type, title, message, duration }: { type: ToastType; title: string; message?: string; duration?: number }) => {
    return toast({ type, title, message, duration });
  }, []);

  const remove = useCallback((id: string) => {
    dismiss(id);
  }, []);

  const clear = useCallback(() => {
    clearAll();
  }, []);

  return { toasts, show, remove, clear };
}
