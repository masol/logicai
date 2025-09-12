
import { eventBus } from "./utils/evtbus";

export async function initLib(): Promise<void> {
  eventBus.init();
}

