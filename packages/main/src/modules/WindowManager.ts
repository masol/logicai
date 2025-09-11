import type { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import { BrowserWindow } from "electron";
import type { AppInitConfig } from "../AppInitConfig.js";
import path from "node:path";
import sirv from "sirv";
import { createServer, type Server } from "http";
import { LaiApp } from "../app/index.js";

class WindowManager implements AppModule {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;
  #sirvRoot: string = ""; // 只有启动了本地静态文件服务器，这里保存root路径．
  #server: Server | null = null;

  constructor({
    initConfig,
    openDevTools = false,
  }: {
    initConfig: AppInitConfig;
    openDevTools?: boolean;
  }) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;
  }

  async enable({ app }: ModuleContext): Promise<void> {
    console.log("enter enable!!!!")
    await app.whenReady();
    console.log("ready!!!!!!")
    await this.restoreOrCreateWindow(true, app);
    app.on("second-instance", () => this.restoreOrCreateWindow(true, app));
    app.on("activate", () => this.restoreOrCreateWindow(true, app));
  }

  #cleanupServer() {
    if (this.#server) {
      this.#server.close(() => {
        console.log("Production server closed");
      });
      this.#server = null;
    }
  }

  async #setupProductionServer(targetPath: string): Promise<[Server, string]> {
    const distPath = path.dirname(targetPath);
    console.log("Using dist path:", distPath);

    const assets = sirv(distPath, {
      single: true, // SPA 模式
      dev: false,
      etag: true, // 启用 ETag 缓存
      dotfiles: false, // 不服务隐藏文件
    });

    const server = createServer(assets);

    // 监听错误事件
    return new Promise((resolve, reject) => {
      server.on("error", (error) => {
        reject(error);
      });

      server.listen(
        {
          port: 0,
          host: "localhost",
        },
        () => {
          const address = server.address();

          // 类型检查：确保 address 是 AddressInfo 对象
          if (!address || typeof address === "string") {
            reject(new Error("Failed to get server address"));
            return;
          }

          const port = address.port;
          const baseUrl = `http://localhost:${port}`;

          this.#sirvRoot = distPath;

          console.log(`Production server running on ${baseUrl}`);
          resolve([server, baseUrl]);
        }
      );
    });
  }

  async createWindow(app: Electron.App): Promise<BrowserWindow> {
    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
    });

    const laiapp = new LaiApp(app, browserWindow);
    await laiapp.beforeShow();

    if (this.#renderer instanceof URL) {
      console.log("load url=", this.#renderer.href);
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      let urlBase;
      [this.#server, urlBase] = await this.#setupProductionServer(
        this.#renderer.path
      );

      await browserWindow.loadURL(
        `${urlBase}/${path.basename(this.#renderer.path)}`
      );

      // 应用关闭时关闭服务器
      browserWindow.on("closed", () => {
        this.#cleanupServer();
      });
    }

    browserWindow.maximize();
    return browserWindow;
  }

  async restoreOrCreateWindow(show = false, app: Electron.App) {
    let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow(app);
    }

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      window?.webContents.openDevTools();
    }

    window.focus();

    return window;
  }
}

export function createWindowManagerModule(
  ...args: ConstructorParameters<typeof WindowManager>
) {
  return new WindowManager(...args);
}
