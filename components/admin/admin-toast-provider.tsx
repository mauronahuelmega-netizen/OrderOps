"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";

type AdminToastTone = "success" | "error" | "info";

type AdminToast = {
  id: string;
  message: string;
  tone: AdminToastTone;
};

type AdminToastInput = {
  message: string;
  tone?: AdminToastTone;
};

type AdminToastContextValue = {
  pushToast: (input: AdminToastInput) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function useAdminToast() {
  const context = useContext(AdminToastContext);

  if (!context) {
    throw new Error("useAdminToast must be used within AdminToastProvider.");
  }

  return context;
}

export default function AdminToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ message, tone = "info" }: AdminToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((currentToasts) => [...currentToasts.slice(-2), { id, message, tone }]);

      const timer = setTimeout(() => {
        removeToast(id);
      }, tone === "error" ? 5000 : 3200);

      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);
  const politeToasts = toasts.filter((toast) => toast.tone !== "error");
  const assertiveToasts = toasts.filter((toast) => toast.tone === "error");

  return (
    <AdminToastContext.Provider value={value}>
      {children}

      <div className="admin-toast-layer">
        <div className="admin-toast-viewport" aria-live="polite" aria-atomic="true">
          {politeToasts.map((toast) => (
            <div
              key={toast.id}
              className={`admin-toast admin-toast--${toast.tone}`}
              role="status"
            >
              <p>{toast.message}</p>
              <button
                type="button"
                className="admin-toast__close"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificacion"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>

        <div className="admin-toast-viewport admin-toast-viewport--assertive" aria-live="assertive" aria-atomic="true">
          {assertiveToasts.map((toast) => (
            <div
              key={toast.id}
              className={`admin-toast admin-toast--${toast.tone}`}
              role="alert"
            >
              <p>{toast.message}</p>
              <button
                type="button"
                className="admin-toast__close"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificacion"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminToastContext.Provider>
  );
}
