import pkg from './package.json' with {type: 'json'};
import mapWorkspaces from '@npmcli/map-workspaces';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export default /** @type import('electron-builder').Configuration */
  ({
    appId: 'com.lizhutang.logicai', // 添加 appId
    productName: 'lai', // pkg.name || 'LogicAI', // 确保有产品名    
    executableName: 'lai', // 添加这一行来指定可执行文件名称
    directories: {
      output: 'dist',
      buildResources: 'buildResources',
    },
    generateUpdatesFilesForAllChannels: true,
    compression: 'normal',
    linux: {
      target: [
        {
          target: 'deb',
          arch: ['x64']
        },
        {
          target: 'AppImage',
          arch: ['x64']
        }
      ],
      category: 'Utility',
      maintainer: 'Lizhuang<masol.li@gmail.com>',
      vendor: 'Lizhutang',
      synopsis: '逻辑向AI',
      description: '结合逻辑与神经元的AI工具,尝试模拟人脑.',
    },
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64']
        },
        {
          target: 'portable',
          arch: ['x64']
        }
      ],
      icon: 'buildResources/icon.ico',
      verifyUpdateCodeSignature: false,
      legalTrademarks: 'Lizhutang',
      requestedExecutionLevel: 'asInvoker',
      signAndEditExecutable: false,
    },
    nsis: {
      oneClick: false,
      perMachine: false,
      allowElevation: true,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: 'lai',
      installerIcon: 'buildResources/icon.ico', // 添加安装程序图标
      uninstallerIcon: 'buildResources/icon.ico', // 添加卸载程序图标      
    },
    /**
     * It is recommended to avoid using non-standard characters such as spaces in artifact names,
     * as they can unpredictably change during deployment, making them impossible to locate and download for update.
     */
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
    files: [
      'LICENSE*',
      pkg.main,
      '!node_modules/@app/**',
      ...await getListOfFilesFromEachWorkspace(),
    ],
  });

/**
 * By default, electron-builder copies each package into the output compilation entirety,
 * including the source code, tests, configuration, assets, and any other files.
 *
 * So you may get compiled app structure like this:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── src/            # Garbage. May be safely removed
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   ├── vite.config.js  # Garbage
 * │       │   ├── .env            # some sensitive config
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 *
 * To prevent this, we read the “files”
 * property from each package's package.json
 * and add all files that do not match the patterns to the exclusion list.
 *
 * This way,
 * each package independently determines which files will be included in the final compilation and which will not.
 *
 * So if `package-a` in its `package.json` describes
 * ```json
 * {
 *   "name": "package-a",
 *   "files": [
 *     "dist/**\/"
 *   ]
 * }
 * ```
 *
 * Then in the compilation only those files and `package.json` will be included:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 */
async function getListOfFilesFromEachWorkspace() {

  /**
   * @type {Map<string, string>}
   */
  const workspaces = await mapWorkspaces({
    cwd: process.cwd(),
    pkg,
  });

  const allFilesToInclude = [];

  for (const [name, path] of workspaces) {
    const pkgPath = join(path, 'package.json');
    const { default: workspacePkg } = await import(pathToFileURL(pkgPath), { with: { type: 'json' } });

    let patterns = workspacePkg.files || ['dist/**', 'package.json'];

    patterns = patterns.map(p => join('node_modules', name, p));
    allFilesToInclude.push(...patterns);
  }

  return allFilesToInclude;
}
