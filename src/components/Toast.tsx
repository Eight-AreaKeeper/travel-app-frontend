import { create } from 'zustand';
import { useEffect } from 'react';

type ToastState = { message: string | null; show: (message: string) => void; clear: () => void };

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));

export const toast = (message: string) => useToastStore.getState().show(message);

export function ToastHost() {
  const { message, clear } = useToastStore();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clear, 2600);
    return () => clearTimeout(timer);
  }, [message, clear]);
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
