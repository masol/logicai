import { spawn } from "child_process";
import { build } from 'vite';
import readline from 'readline';
import path from "path";
import net from "net";

const mode = "development";
process.env.NODE_ENV = mode;
process.env.MODE = mode;

const FIXED_PORT = 5173;
let actualPort = FIXED_PORT;
let BASE_URL = `http://localhost:${actualPort}`;
let mockRendererWatchServer;

console.log("正在启动 renderer 开发服务器...");

// 启动外部进程
const rendererProcess = spawn("npm", ["run", "dev"], {
  stdio: "pipe",
  shell: true,
  cwd: path.resolve("packages/renderer"),
  env: { ...process.env },
  detached: process.platform !== "win32",
});

let serverReady = false;
let isShuttingDown = false;

// 端口检测函数
function checkPortOpen(port, host = "localhost", timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);

    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

// 检查进程是否还在运行
function isProcessRunning(pid) {
  try {
    // 发送信号 0 来检查进程是否存在，不会实际杀死进程
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

// 等待端口关闭
async function waitForPortClosed(port, maxWaitTime = 30000) {
  const startTime = Date.now();
  console.log(`等待端口 ${port} 关闭...`);

  while (Date.now() - startTime < maxWaitTime) {
    const isOpen = await checkPortOpen(port, "localhost", 500);
    if (!isOpen) {
      console.log(`端口 ${port} 已关闭`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`等待端口 ${port} 关闭超时`);
  return false;
}

// 等待进程完全退出
async function waitForProcessExit(pid, maxWaitTime = 30000) {
  const startTime = Date.now();
  console.log(`等待进程 ${pid} 退出...`);

  while (Date.now() - startTime < maxWaitTime) {
    if (!isProcessRunning(pid)) {
      console.log(`进程 ${pid} 已退出`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`等待进程 ${pid} 退出超时`);
  return false;
}

// 输出进程日志
rendererProcess.stdout.on("data", (data) => {
  const message = data.toString();
  process.stdout.write(`[Renderer] ${message}`);

  if (!serverReady) {
    const portMatch = message.match(/Local:\s+http:\/\/localhost:(\d+)/);
    if (portMatch) {
      actualPort = parseInt(portMatch[1], 10);
      BASE_URL = `http://localhost:${actualPort}`;
      serverReady = true;
      console.log(`\nDetected server on port ${actualPort}`);
      setupMockServer();
      buildOtherPackages().catch(console.error);
    }
  }
});

rendererProcess.stderr.on("data", (data) => {
  process.stderr.write(`[Renderer Error] ${data}`);
});

// 监听子进程退出
rendererProcess.on("close", (code, signal) => {
  if (!isShuttingDown) {
    console.log(`\nRenderer 进程意外退出，代码: ${code}, 信号: ${signal}`);
    process.exit(1);
  } else {
    console.log(`Renderer 进程已关闭，代码: ${code}, 信号: ${signal}`);
  }
});

rendererProcess.on("error", (error) => {
  console.error("启动 Renderer 进程失败:", error);
  process.exit(1);
});


function setupMockServer() {
  mockRendererWatchServer = {
    resolvedUrls: {
      local: [BASE_URL],
      network: [],
    },
    config: {
      server: {
        port: actualPort,
        host: "localhost",
      },
    },
    close: async () => {
      console.log("模拟服务器关闭（实际由进程管理）");
    },
    ws: {
      send: async (type) => {
        console.log("接受指令，一般是请求热加载", type);
      },
    },
  };

  process.env.VITE_DEV_SERVER_URL = BASE_URL;

  console.log(`\nRenderer 服务器已启动: ${BASE_URL}`);
  console.log("开始构建其他包...\n");
}


async function buildOtherPackages() {
  const packagesToStart = ["packages/preload", "packages/main"];

  for (const pkg of packagesToStart) {
    try {
      console.log(`正在构建 ${pkg}...`);

      // 使用简化的配置进行构建，因为它会加载各自的 vite.config.js
      await build({ root: path.resolve(pkg), mode });
      console.log(`${pkg} 构建完成`);
    } catch (error) {
      console.error(`构建 ${pkg} 失败:`, error);
    }
  }

  console.log("\n所有包构建完成！");
}

// 改进的清理函数
async function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("\n正在关闭开发服务器...");

  if (rendererProcess && !rendererProcess.killed) {
    const pid = rendererProcess.pid;
    console.log(`正在终止进程 ${pid}...`);

    try {
      if (process.platform === "win32") {
        // Windows: 使用 taskkill 强制终止进程树
        const killProcess = spawn("taskkill", ["/pid", pid, "/T", "/F"], {
          stdio: "ignore",
        });

        // 等待 taskkill 命令执行完成
        await new Promise((resolve) => {
          killProcess.on("close", resolve);
          setTimeout(resolve, 3000); // 3秒超时
        });
      } else {
        // Unix-like: 优雅关闭
        rendererProcess.kill("SIGTERM");

        // 等待进程优雅退出
        const gracefulExit = await waitForProcessExit(pid, 5000);

        if (!gracefulExit) {
          console.log("优雅关闭超时，强制终止进程...");
          rendererProcess.kill("SIGKILL");
          await waitForProcessExit(pid, 5000);
        }
      }

      // 等待端口关闭
      await waitForPortClosed(actualPort, 10000);

      // 最终检查进程是否真正退出
      if (isProcessRunning(pid)) {
        console.warn(`警告: 进程 ${pid} 仍在运行`);
      } else {
        console.log("服务器已完全关闭");
      }
    } catch (error) {
      console.error("关闭子进程时出错:", error);
    }
  }
}

// 监听各种退出信号
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

// 监听进程正常退出
process.on("exit", () => {
  // exit 事件中不能使用异步操作，只能同步清理
  if (rendererProcess && !rendererProcess.killed) {
    try {
      rendererProcess.kill("SIGKILL");
    } catch (error) {
      // 忽略错误
    }
  }
});

// 监听未捕获的异常
process.on("uncaughtException", async (error) => {
  console.error("未捕获的异常:", error);
  await cleanup();
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error("未处理的 Promise 拒绝:", reason);
  await cleanup();
  process.exit(1);
});

// Windows 特有的信号处理
if (process.platform === "win32") {
    const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("SIGINT", async () => {
    await cleanup();
    process.exit(0);
  });
}
