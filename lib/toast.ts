type ToastType = 'success' | 'info' | 'error';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners: Set<ToastListener> = new Set();

export const subscribeToast = (listener: ToastListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const showToast = (message: string, type: ToastType = 'success') => {
  const toastMessage: ToastMessage = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    message,
    type,
  };
  listeners.forEach((listener) => listener(toastMessage));
};
