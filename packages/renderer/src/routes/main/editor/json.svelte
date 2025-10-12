<script lang="ts">
  import { JSONEditor } from "svelte-jsoneditor";
  import { onMount } from "svelte";
  import { rpc } from "@app/preload";
  import JSON5 from "json5";

  let content = $state({ json: {} });
  let isLoading = $state(true);
  let isSaving = $state(false);

  // 加载JSON数据
  async function loadData() {
    isLoading = true;
    const taskData = (await rpc.task.shared()) || {};
    content = { json: taskData };
    isLoading = false;
  }

  /**
   * 处理JSON编辑器的变更事件
   *
   * @param updatedContent - 编辑器返回的更新后的内容对象
   * @param previousContent - 编辑器返回的更新前的内容对象
   * @param patchResult - 包含详细变更信息的对象，包括：
   *   - patchResult.contentErrors - 内容验证错误（如果有）
   *   - patchResult.patchErrors - 补丁应用错误（如果有）
   *
   * 注意：svelte-jsoneditor 的 onChange 主要提供三个参数：
   * 1. updatedContent: 新的完整内容 { json: any } 或 { text: string }
   * 2. previousContent: 旧的完整内容
   * 3. patchResult: { undo, redo } 撤销/重做操作的补丁信息
   */
  async function handleChange(updatedContent, previousContent, patchResult) {
    // console.log("=== JSON编辑器变更事件 ===");

    // 1. 完整的新内容
    // console.log("新内容:", updatedContent);

    // // 2. 完整的旧内容
    // console.log("旧内容:", previousContent);

    // // 3. 补丁信息（用于撤销/重做）
    // console.log("补丁结果:", patchResult);

    // 更新本地状态
    content = updatedContent;

    // 保存到后端
    try {
      isSaving = true;

      // 提取JSON数据并保存
      const jsonData = updatedContent.json;

      // 调用后端保存方法（需要根据你的实际API调整）
      await rpc.task.saveShared(jsonData);

      console.log("已保存数据:", jsonData);

      // 可选：显示保存成功提示
      // showSuccessToast("保存成功");
    } catch (error) {
      console.error("保存失败:", error);

      // 可选：显示错误提示并回滚
      // showErrorToast("保存失败，请重试");
      // content = previousContent; // 回滚到之前的内容
    } finally {
      isSaving = false;
    }
  }

  // /**
  //  * 如果你需要监听特定路径的变化，可以使用 onChangeText 或 onChangeJSON
  //  * 这里提供一个手动对比路径变化的辅助函数
  //  */
  // function getChangedPaths(oldObj, newObj, basePath = "") {
  //   const changes = [];

  //   // 检查新增或修改的键
  //   for (const key in newObj) {
  //     const currentPath = basePath ? `${basePath}.${key}` : key;

  //     if (!(key in oldObj)) {
  //       // 新增的键
  //       changes.push({
  //         type: "added",
  //         path: currentPath,
  //         value: newObj[key],
  //       });
  //     } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
  //       // 修改的键
  //       if (typeof newObj[key] === "object" && newObj[key] !== null) {
  //         // 递归检查嵌套对象
  //         changes.push(
  //           ...getChangedPaths(oldObj[key], newObj[key], currentPath),
  //         );
  //       } else {
  //         changes.push({
  //           type: "modified",
  //           path: currentPath,
  //           oldValue: oldObj[key],
  //           newValue: newObj[key],
  //         });
  //       }
  //     }
  //   }

  //   // 检查删除的键
  //   for (const key in oldObj) {
  //     if (!(key in newObj)) {
  //       const currentPath = basePath ? `${basePath}.${key}` : key;
  //       changes.push({
  //         type: "deleted",
  //         path: currentPath,
  //         oldValue: oldObj[key],
  //       });
  //     }
  //   }

  //   return changes;
  // }

  /**
   * 将 Proxy 对象转换为普通 JavaScript 对象
   * 深度克隆并去除所有 Proxy 包装
   */
  function unwrapProxy(obj) {
    // 处理 null 和 undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 处理基本类型
    if (typeof obj !== "object") {
      return obj;
    }

    // 处理日期对象
    if (obj instanceof Date) {
      return new Date(obj);
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map((item) => unwrapProxy(item));
    }

    // 处理普通对象（包括 Proxy）
    // 使用 JSON.parse(JSON.stringify()) 是最简单的方法
    // 但会丢失函数、undefined、Symbol 等特殊值
    try {
      return JSON5.parse(JSON.stringify(obj));
    } catch (error) {
      console.error("JSON序列化失败，使用手动深拷贝:", error);

      // 备用方案：手动深拷贝
      const plain = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          plain[key] = unwrapProxy(obj[key]);
        }
      }
      return plain;
    }
  }

  /**
   * 另一种方法：使用 structuredClone（现代浏览器支持）
   * 这个方法更强大，能处理更多类型
   */
  function unwrapProxyModern(obj) {
    try {
      // structuredClone 会自动处理 Proxy 并创建深拷贝
      return structuredClone(obj);
    } catch (error) {
      console.warn("structuredClone 失败，回退到 JSON 方法:", error);
      return unwrapProxy(obj);
    }
  }
  /**
   * 增强版的变更处理函数，包含详细的路径变更信息
   */
  async function handleChangeWithPaths(
    updatedContent,
    previousContent,
    patchResult,
  ) {
    // @todo: 无法parse时，这里要给用户提示．
    if (updatedContent.text) {
      updatedContent.json = JSON5.parse(updatedContent.text);
    } else if (updatedContent.json) {
      updatedContent.json = unwrapProxyModern(updatedContent.json);
    }

    // 获取详细的变更路径
    // const changes = getChangedPaths(
    //   previousContent.json || {},
    //   updatedContent.json || {},
    // );

    // console.log("=== 详细变更信息 ===");
    // console.log("变更路径:", changes);

    // 示例输出：
    // [
    //   { type: "modified", path: "user.name", oldValue: "John", newValue: "Jane" },
    //   { type: "added", path: "user.age", value: 30 },
    //   { type: "deleted", path: "user.email", oldValue: "old@email.com" }
    // ]

    // 调用原有的保存逻辑
    await handleChange(updatedContent, previousContent, patchResult);
  }

  onMount(() => {
    loadData();
  });
</script>

<div
  class="flex h-full w-full flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative"
>
  {#if isLoading}
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
        ></div>
        <p class="text-slate-600 dark:text-slate-400">加载数据中...</p>
      </div>
    </div>
  {:else}
    <div class="w-full h-full relative">
      <JSONEditor
        {content}
        readOnly={false}
        mainMenuBar={true}
        navigationBar={true}
        statusBar={true}
        onChange={handleChangeWithPaths}
      />

      {#if isSaving}
        <div
          class="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <div
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></div>
          <span>保存中...</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  :global(.jse-theme-dark) {
    --jse-background-color: rgb(30 41 59);
    --jse-panel-background: rgb(15 23 42);
  }
</style>
