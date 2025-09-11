import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

export const appRouter = t.router({
  // Placeholder for future API endpoints
});

export type AppRouter = typeof appRouter;
