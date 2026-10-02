import { createFileRoute } from "@tanstack/react-router";
import { authUser, searchPlaces } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/places")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authUser(request))) return new Response("Unauthorized", { status: 401 });
        const { query } = (await request.json()) as { query?: string };
        const q = String(query ?? "").trim().slice(0, 200);
        if (q.length < 3) return new Response("Digite pelo menos 3 letras", { status: 400 });
        try {
          return Response.json(await searchPlaces(q, 10));
        } catch (e) {
          return new Response((e as Error).message, { status: 502 });
        }
      },
    },
  },
});
