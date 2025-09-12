import { AppContext } from "./context.js";
import { ipcMain } from "electron";
import { applyRoute } from "./router.js";

// import { setupTRPCHandler } from "../api/router.js";

export class LaiApp {
  #context: AppContext;

  constructor(app: Electron.App, win: Electron.BrowserWindow) {
    this.#context = new AppContext(app, win);
    // setupTRPCHandler(win, this.#context);
  }

  async beforeShow() {
    const mainWindow = this.#context.win;
    mainWindow.on("close", (event: Electron.Event) => {
      event.preventDefault();
      this.#context.db.close().finally(() => {
        mainWindow.destroy();
      });
    });

    ipcMain.handle("lai-rpc", (event, reqPath, ...args) => {
      return applyRoute(this.#context, reqPath, ...args);
    });
    // initTRPC(mainWindow);
  }

}