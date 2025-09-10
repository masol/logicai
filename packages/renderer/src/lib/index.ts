
import { eventBus } from "./utils/evtbus";
import rpc from '@app/preload/router';

export async function initLib(): Promise<void> {
  eventBus.init();
  // 现在我们使用 tRPC，所以不再需要旧的 apiClient
  console.log('tRPC client initialized');
}

export { rpc };
