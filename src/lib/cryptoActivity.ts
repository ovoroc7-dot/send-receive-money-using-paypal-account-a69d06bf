import { supabase } from "@/integrations/supabase/client";

export async function logCryptoActivity(kind: "crypto_send" | "crypto_receive", usd: number, units: string, counterparty: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("transactions").insert({
    user_id: data.user.id,
    kind,
    amount: Math.round(usd * 100) / 100,
    counterparty: counterparty.slice(0, 120),
    note: units,
    status: "completed",
  });
}
