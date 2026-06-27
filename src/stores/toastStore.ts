import { create } from 'zustand';

/**
 * 전역 toast 알림 상태.
 * Toaster 컴포넌트(Layout에 1회 마운트)가 이 스토어를 구독해 렌더링한다.
 * 컴포넌트 밖(이벤트 핸들러)에서도 쓰도록 `toast` 헬퍼를 함께 제공한다.
 */
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  show: (type: ToastType, message: string) => void;
  remove: (id: number) => void;
}

let nextId = 0;
const DURATION = 3000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (type, message) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => get().remove(id), DURATION);
  },

  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** 컴포넌트 밖에서 호출하기 위한 헬퍼. `toast.success('...')` 형태. */
export const toast = {
  success: (message: string) =>
    useToastStore.getState().show('success', message),
  error: (message: string) => useToastStore.getState().show('error', message),
  info: (message: string) => useToastStore.getState().show('info', message),
};
