/**
 * Utilitário universal de IA que funciona tanto via Server API quanto direto via Browser/Client
 * Permite que a chave OpenAI funcione no Lovable, Vercel ou localmente.
 */

const DEFAULT_KEY = "";

export function getOpenAIApiKey(): string {
  // 1. Tenta do localStorage do navegador (caso o usuário tenha inserido em configurações)
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("santos_mktpro_openai_key");
    if (saved && saved.trim().startsWith("sk-")) return saved.trim();
  }

  // 2. Tenta das variáveis de ambiente (Vite / Node)
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    const envKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    if (envKey && envKey.trim().startsWith("sk-")) return envKey.trim();
  }

  if (typeof process !== "undefined" && process.env) {
    const pKey = process.env.OPENAI_API_KEY;
    if (pKey && pKey.trim().startsWith("sk-")) return pKey.trim();
  }

  // 3. Fallback para a chave padrão configurada
  return DEFAULT_KEY;
}

export function setOpenAIApiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("santos_mktpro_openai_key", key.trim());
  }
}

/**
 * Realiza chat com OpenAI com streaming
 */
export async function streamOpenAICompletion(
  messages: { role: string; content: string }[],
  options: {
    model?: string;
    signal?: AbortSignal;
    onDelta?: (delta: string) => void;
  } = {}
): Promise<string> {
  const apiKey = getOpenAIApiKey();
  const model = options.model || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = `Erro OpenAI (${res.status}): ${errorText.slice(0, 250)}`;
    if (res.status === 401) msg = "Chave da OpenAI inválida ou não autorizada. Verifique seus créditos na OpenAI.";
    if (res.status === 429) msg = "Créditos esgotados ou limite de taxa na sua conta da OpenAI.";
    throw new Error(msg);
  }

  if (!res.body) throw new Error("Sem resposta da OpenAI.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          options.onDelta?.(delta);
        }
      } catch {
        // Ignora chunks incompletos
      }
    }
  }

  return fullText;
}

/**
 * Realiza chamada para OpenAI retornando JSON
 */
export async function getOpenAIJson(
  prompt: string,
  options: { model?: string; signal?: AbortSignal } = {}
): Promise<any> {
  const apiKey = getOpenAIApiKey();
  const model = options.model || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = `Erro OpenAI (${res.status}): ${errorText.slice(0, 250)}`;
    if (res.status === 401) msg = "Chave da OpenAI inválida ou não autorizada.";
    if (res.status === 429) msg = "Créditos da OpenAI esgotados ou taxa excedida.";
    throw new Error(msg);
  }

  const json = (await res.json()) as any;
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("A OpenAI não retornou dados.");

  return JSON.parse(content);
}
