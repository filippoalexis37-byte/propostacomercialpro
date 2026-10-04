import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Body = z.object({
  to: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().max(5000),
  filename: z.string().max(150),
  pdfBase64: z.string().max(15_000_000),
});

const b64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const hdr = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export const Route = createFileRoute("/api/send-proposal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims } = await sb.auth.getClaims(token);
        if (!claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });

        const parsed = Body.safeParse(await request.json());
        if (!parsed.success) return new Response("Dados inválidos (confira o e-mail).", { status: 400 });
        const d = parsed.data;
        const boundary = "smp" + crypto.randomUUID().replace(/-/g, "");
        const pdf = d.pdfBase64.replace(/(.{76})/g, "$1\r\n");
        const mime = [
          `To: ${d.to}`,
          `Subject: ${hdr(d.subject)}`,
          "MIME-Version: 1.0",
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          "",
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          "Content-Transfer-Encoding: base64",
          "",
          b64(d.message).replace(/(.{76})/g, "$1\r\n"),
          `--${boundary}`,
          `Content-Type: application/pdf; name="${d.filename}"`,
          `Content-Disposition: attachment; filename="${d.filename}"`,
          "Content-Transfer-Encoding: base64",
          "",
          pdf,
          `--${boundary}--`,
        ].join("\r\n");
        const raw = b64(mime).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const res = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
            "X-Connection-Api-Key": process.env["GOOGLE_MAIL_API_KEY"]!,
          },
          body: JSON.stringify({ raw }),
        });
        if (!res.ok) {
          const t = await res.text();
          console.error(`Gmail send failed [${res.status}]: ${t}`);
          return new Response(`Falha no envio [${res.status}]: ${t.slice(0, 300)}`, { status: 502 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
