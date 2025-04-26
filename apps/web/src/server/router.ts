import { initTRPC } from "@trpc/server";
import { z } from "zod";
import * as trpcNext from "@trpc/server/adapters/next";

const t = initTRPC.create();
export const appRouter = t.router({
  match: t.router({
    enqueue: t.procedure
      .input(z.object({ role: z.enum(["I", "W"]), elo: z.number() }))
      .mutation(({ input }) => fetch(`/api/match/queue?role=${input.role}&elo=${input.elo}`, { method: "POST" })),
    poll: t.procedure.query(() => fetch("/api/match/poll", { method: "POST" }).then((r) => r.json())),
  }),
  game: t.router({
    guess: t.procedure
      .input(z.object({ gameId: z.string(), suspect_ai: z.boolean() }))
      .mutation(({ input }) => fetch(`/api/rooms/${input.gameId}/guess`, { method: "POST", body: JSON.stringify({ suspect_ai: input.suspect_ai }) })),
    byId: t.procedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => fetch(`/api/games/${input.id}`).then((r) => r.json())),
  }),
  user: t.router({
    me: t.procedure.query(() => fetch("/api/users/me").then((r) => r.json())),
  }),
});
export type AppRouter = typeof appRouter;
export const handler = trpcNext.createNextApiHandler({ router: appRouter });