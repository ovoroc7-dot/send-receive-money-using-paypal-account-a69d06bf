import { useEffect, useState } from "react";

export const PAYMENT_STATUS_SETTING_KEY = "pp:settings:payment-status-enabled";

export function readPaymentStatusSetting(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PAYMENT_STATUS_SETTING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Whether the user may choose Pending/Completed when sending money. Off = always pending. */
export function usePaymentStatusSetting() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readPaymentStatusSetting());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PAYMENT_STATUS_SETTING_KEY) setEnabled(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const set = (v: boolean) => {
    setEnabled(v);
    try {
      localStorage.setItem(PAYMENT_STATUS_SETTING_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return { enabled, setEnabled: set };
}
