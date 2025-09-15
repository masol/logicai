
import { eventBus } from "./utils/evtbus";
import { initSharedStores } from './stores/shared.svelte'
import { loadHistory } from './stores/chatStore'

export async function initLib(): Promise<void> {
  eventBus.init();
  await Promise.all([
    loadHistory(),
    initSharedStores()
  ])
}

