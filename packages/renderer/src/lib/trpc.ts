import { createTRPCProxyClient } from 'electron-trpc';
import type { AppRouter } from '@app/main';

export default createTRPCProxyClient<AppRouter>();
