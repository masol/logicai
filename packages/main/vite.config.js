import { defineConfig } from 'vite';
import { getNodeMajorVersion } from '@app/electron-versions';
import { spawn } from 'child_process';
import electronPath from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// 可配置文本文件后缀
const TEXT_FILE_EXTENSIONS = ['.pl', '.emd', '.txt'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  build: {
    ssr: true,
    sourcemap: mode === 'development' ? 'inline' : false,
    outDir: 'dist',
    assetsDir: '.',
    target: `node${getNodeMajorVersion()}`,
    lib: {
      entry: {
        index: 'src/index.ts',
        worker: 'src/app/swipl/worker.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name].js',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    rawTextImportPlugin(TEXT_FILE_EXTENSIONS), // 支持多种文本后缀
    handleHotReload(),  // 热重启 Electron 主进程
  ],
  resolve: {
    alias: {
      '@app/main': path.resolve(__dirname, 'src'),
    },
  },
}));

/**
 * 通用文本导入插件
 * 允许把指定后缀的文件作为字符串导入
 * @param {string[]} extensions
 * @return {import('vite').Plugin}
 */
function rawTextImportPlugin(extensions) {
  return {
    name: 'vite-plugin-raw-text',
    transform(code, id) {
      if (extensions.some(ext => id.endsWith(ext))) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: null,
        };
      }
    },
  };
}


/**
 * 实现 Electron 主进程文件变更时自动重启
 * @return {import('vite').Plugin}
 */
function handleHotReload() {
  let electronApp = null;
  let rendererWatchServer = null;

  return {
    name: '@app/main-process-hot-reload',

    config(config, env) {
      if (env.mode !== 'development') return;

      const rendererWatchServerProvider =
        config.plugins.find((p) => p.name === '@app/renderer-watch-server-provider');
      if (!rendererWatchServerProvider) return;

      rendererWatchServer =
        rendererWatchServerProvider.api.provideRendererWatchServer();

      process.env.VITE_DEV_SERVER_URL =
        rendererWatchServer.resolvedUrls.local[0];

      return {
        build: {
          watch: {},
        },
      };
    },

    writeBundle() {
      if (process.env.NODE_ENV !== 'development') return;

      if (electronApp !== null) {
        electronApp.removeListener('exit', process.exit);
        electronApp.kill('SIGINT');
        electronApp = null;
      }

      electronApp = spawn(String(electronPath), ['--inspect', '.'], {
        stdio: 'inherit',
      });

      electronApp.addListener('exit', process.exit);
    },
  };
}