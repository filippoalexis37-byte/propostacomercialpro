/**
 * Utilitários para chamadas diretas à API oficial da OpenAI com créditos do usuário
 */

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"] || "";

/**
 * Executa uma chamada para OpenAI Chat Completions retornando objeto JSON
 */
export async function openAiChatJson(prompt: string, options: { model?: string; signal?: AbortSignal } = {}): Promise<any> {
  const model = options.model || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
    let errorMsg = `Erro OpenAI [${res.status}]: ${errorText.slice(0, 300)}`;
    if (res.status === 401) errorMsg = "Chave da OpenAI inválida ou não autorizada.";
    if (res.status === 429) errorMsg = "Limite de taxa ou créditos insuficientes na OpenAI.";
    throw new Error(errorMsg);
  }

  const json = (await res.json()) as any;
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("A OpenAI não retornou conteúdo.");

  return JSON.parse(content);
}

/**
 * Executa streaming de texto para o chat do Assistente de Nicho
 */
export async function openAiChatStream(
  messages: { role: string; content: string }[],
  options: { model?: string; signal?: AbortSignal } = {}
): Promise<ReadableStream<Uint8Array>> {
  const model = options.model || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
    }),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`OpenAI Stream Error [${res.status}]: ${err.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          } catch {
            // Ignora linhas incompletas
          }
        }
      }
    },
  });
}
