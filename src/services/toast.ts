/**
 * Toast notification system
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  listeners: Array<(toasts: Toast[]) => void>;
}

const state: ToastState = { toasts: [], listeners: [] };

let nextId = 1;

export function subscribe(fn: (toasts: Toast[]) => void): () => void {
  state.listeners.push(fn);
  return () => {
    state.listeners = state.listeners.filter((l) => l !== fn);
  };
}

export function getToasts(): Toast[] {
  return [...state.toasts];
}

function emit(): void {
  const snap = [...state.toasts];
  state.listeners.forEach((fn) => fn(snap));
}

export function toast({ type, title, message, duration = 4000 }: { type: ToastType; title: string; message?: string; duration?: number }): string {
  const id = (nextId++).toString();
  const item: Toast = { id, type, title, message, duration };
  state.toasts.unshift(item);
  emit();
  if (duration > 0) {
    setTimeout(() => {
      dismiss(id);
    }, duration);
  }
  return id;
}

export function dismiss(id: string): void {
  state.toasts = state.toasts.filter((t) => t.id !== id);
  emit();
}

export function clearAll(): void {
  state.toasts = [];
  emit();
}

export function success(title: string, message?: string): string {
  return toast({ type: 'success', title, message });
}

export function error(title: string, message?: string): string {
  return toast({ type: 'error', title, message });
}

export function warning(title: string, message?: string): string {
  return toast({ type: 'warning', title, message });
}

export function info(title: string, message?: string): string {
  return toast({ type: 'info', title, message });
}
