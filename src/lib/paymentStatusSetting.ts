import { useEffect, useState } from "react";

export const PAYMENT_STATUS_SETTING_KEY = "pp:settings:payment-status-enabled";
export const PAYMENT_STATUS_VALUE_KEY = "pp:settings:payment-status-value";

export type PaymentStatus = "pending" | "completed";

export function readPaymentStatusSetting(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PAYMENT_STATUS_SETTING_KEY) === "1";
  } catch {
    return false;
  }
}

export function readPaymentStatusValue(): PaymentStatus {
  if (typeof window === "undefined") return "pending";
  try {
    return localStorage.getItem(PAYMENT_STATUS_VALUE_KEY) === "completed"
      ? "completed"
      : "pending";
  } catch {
    return "pending";
  }
}

/**
 * Payment status control. When off, every payment is sent as pending.
 * When on, the user picks Pending or Completed in Account settings and every
 * payment they send uses that choice.
 */
export function usePaymentStatusSetting() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("pending");

  useEffect(() => {
    setEnabled(readPaymentStatusSetting());
    setStatus(readPaymentStatusValue());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PAYMENT_STATUS_SETTING_KEY) setEnabled(e.newValue === "1");
      if (e.key === PAYMENT_STATUS_VALUE_KEY)
        setStatus(e.newValue === "completed" ? "completed" : "pending");
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

  const setStatusValue = (v: PaymentStatus) => {
    setStatus(v);
    try {
      localStorage.setItem(PAYMENT_STATUS_VALUE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  /** The status every payment should be sent with right now. */
  const effectiveStatus: PaymentStatus = enabled ? status : "pending";

  return { enabled, setEnabled: set, status, setStatus: setStatusValue, effectiveStatus };
}
