
import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import type { AppRouter } from '../../main/src/api/router.js';

const client = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});

export default client;
