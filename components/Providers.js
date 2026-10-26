"use client";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import { ToastProvider } from "@/components/Toast";
import { initializeDemoData } from "@/lib/data";
import { refreshData } from "@/lib/hooks";

export default function Providers({ children }) {
  useEffect(() => {
    initializeDemoData();
    // Cross-tab refresh: the browser fires "storage" in OTHER tabs when localStorage changes.
    // This is not server-backed real-time sync.
    const onStorage = () => refreshData();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <SWRConfig value={{ revalidateOnFocus: true, shouldRetryOnError: false, dedupingInterval: 250 }}>
      <ToastProvider>{children}</ToastProvider>
    </SWRConfig>
  );
}
