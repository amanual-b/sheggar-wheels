"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { refreshData } from "@/lib/hooks";

const ToastContext = createContext({ success() {}, error() {}, info() {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 7000 : 4500);
    },
    [dismiss]
  );
  const api = useMemo(() => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Runs the result of a domain action: toast + refresh on success/failure. Returns true when ok. */
export function useAction() {
  const toast = useToast();
  return useCallback(
    (result, successMessage) => {
      if (result && result.ok) {
        if (successMessage) toast.success(successMessage);
        refreshData();
        return true;
      }
      toast.error((result && result.error) || "Something went wrong.");
      return false;
    },
    [toast]
  );
}
