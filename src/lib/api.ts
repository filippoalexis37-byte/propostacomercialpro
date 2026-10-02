import { supabase } from "@/integrations/supabase/client";

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `Erro ${res.status}`);
  return res.json() as Promise<T>;
}
