
import { eventBus } from "./utils/evtbus";
import { initSharedStores } from './stores/shared.svelte'

export async function initLib(): Promise<void> {
  eventBus.init();
  await initSharedStores();
}

