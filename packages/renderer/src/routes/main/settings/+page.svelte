<script lang="ts">
  import { onMount } from "svelte";
  import { slide, fly } from "svelte/transition";
  import { spring, tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import IconSettings from "~icons/mdi/cog";
  import IconGeneral from "~icons/mdi/tune";
  import IconModel from "~icons/mdi/brain";
  import IconMcp from "~icons/mdi/puzzle";
  import IconAdd from "~icons/mdi/plus";
  import IconChevronDown from "~icons/mdi/chevron-down";
  import IconHelp from "~icons/mdi/help-circle-outline";
  import IconEye from "~icons/mdi/eye";
  import IconEyeOff from "~icons/mdi/eye-off";
  import IconLoading from "~icons/mdi/loading";
  import IconPower from "~icons/mdi/power";
  import IconPowerOff from "~icons/mdi/power-off";
  import IconCloud from "~icons/mdi/cloud";
  import IconDesktop from "~icons/mdi/desktop-classic";
  import { modelCategories, presetModels, languages } from "./modes.const";
  import { rpc } from "@app/preload";

  // 加载状态
  let isLoading = $state(true);

  // 当前选中的设置项
  let selectedSection = $state("general");
  let selectedSubSection = $state("");

  // 一般设置
  let currentLanguage = $state("zh-CN");
  let androidName = $state("指挥官");
  let androidGoal = $state("忠实执行使用者命令");
  let showLanguageHelp = $state(false);
  let showNameHelp = $state(false);
  let showGoalHelp = $state(false);

  // 默认嵌入模型
  let defaultEmbeddingModel = $state("");
  let showEmbeddingHelp = $state(false);

  // 模型数据 - 初始为空
  let models = $state({});

  // MCP数据
  let mcpServices = $state([]);

  // 展开状态
  let expandedCategories = $state(new Set());

  // 添加模型弹窗
  let showAddModal = $state(false);
  let newModel = $state({
    name: "",
    apiKey: "",
    showApiKey: false,
  });

  // 添加MCP弹窗
  let showAddMcpModal = $state(false);
  let newMcp = $state({
    name: "",
    description: "",
    type: "local", // local | remote
    command: "",
    url: "",
    apiKey: "",
    showApiKey: false,
  });

  // 动画状态
  const sidebarWidth = spring(320, { stiffness: 0.1, damping: 0.8 });
  const contentOpacity = tweened(1, { duration: 300, easing: cubicOut });

  // 计算可用的嵌入模型（启用的 LLM 模型且支持嵌入）
  let embeddingModels = $derived(
    models["llm"]?.filter((model) => {
      const preset = presetModels[model.name];
      return model.enabled && preset && !preset.noEmbed;
    }) || [],
  );

  // 模拟API调用
  async function loadSettings() {
    const infos = [
      rpc.sys.get("models"),
      rpc.sys.get("currentLanguage"),
      rpc.sys.get("defaultEmbeddingModel"),
      rpc.sys.get("androidName"),
      rpc.sys.get("androidGoal"),
      rpc.sys.get("mcpServices"),
    ];
    const values = await Promise.all(infos);

    // 模拟加载数据
    models = values[0] || {};
    currentLanguage = (values[1] || "zh-CN") as string;
    defaultEmbeddingModel = (values[2] || "") as string;
    androidName = (values[3] || "指挥官") as string;
    androidGoal = (values[4] || "忠实执行使用者指令") as string;
    mcpServices = values[5] || [];

    // 默认展开有模型的分类
    Object.keys(models).forEach((category) => {
      if (models[category].length > 0) {
        expandedCategories.add(category);
      }
    });
    expandedCategories = new Set(expandedCategories);

    isLoading = false;
  }

  async function saveLanguage(language) {
    console.log("保存语言设置:", language);
    await rpc.sys.set("currentLanguage", $state.snapshot(language));
  }

  async function saveAndroidName(name) {
    console.log("保存人造人名称:", name);
    await rpc.sys.set("androidName", $state.snapshot(name));
  }

  async function saveAndroidGoal(goal) {
    console.log("保存人造人目标:", goal);
    await rpc.sys.set("androidGoal", $state.snapshot(goal));
  }

  async function saveEmbeddingModel(model) {
    console.log("保存默认嵌入模型:", model);
    await rpc.sys.set("defaultEmbeddingModel", $state.snapshot(model));
  }

  async function saveModels(modelsData) {
    console.log("保存模型配置:", modelsData);
    await rpc.sys.set("models", $state.snapshot(modelsData));
  }

  async function saveMcpServices(mcpData) {
    console.log("保存MCP服务配置:", mcpData);
    await rpc.sys.set("mcpServices", $state.snapshot(mcpData));
  }

  onMount(() => {
    loadSettings();
  });

  function selectSection(section, subSection = "") {
    selectedSection = section;
    selectedSubSection = subSection;
    contentOpacity.set(0);
    setTimeout(() => contentOpacity.set(1), 150);
  }

  function toggleCategory(category) {
    if (expandedCategories.has(category)) {
      expandedCategories.delete(category);
    } else {
      expandedCategories.add(category);
    }
    expandedCategories = new Set(expandedCategories);
  }

  function onModelSelect() {
    const preset = presetModels[newModel.name];
    if (preset) {
      // 自动填充信息，但保留API key为空
      newModel.apiKey = "";
      newModel.showApiKey = false;
    }
  }

  function addModel() {
    if (!newModel.name || !newModel.apiKey) return;

    const preset = presetModels[newModel.name];
    if (!preset) return;

    const id = Date.now();
    const category = preset.category;

    // 初始化分类数组
    if (!models[category]) {
      models[category] = [];
    }

    // 添加模型
    models[category].push({
      id,
      name: newModel.name,
      provider: preset.provider,
      apiKey: newModel.apiKey,
      enabled: true,
    });

    // 保存模型配置
    saveModels(models);

    // 确保分类展开
    expandedCategories.add(category);
    expandedCategories = new Set(expandedCategories);

    // 重置表单
    newModel = { name: "", apiKey: "", showApiKey: false };
    showAddModal = false;
  }

  function addMcp() {
    if (!newMcp.name || !newMcp.description) return;
    if (newMcp.type === "local" && !newMcp.command) return;
    if (newMcp.type === "remote" && (!newMcp.url || !newMcp.apiKey)) return;

    const id = Date.now();

    // 添加MCP服务
    mcpServices.push({
      id,
      name: newMcp.name,
      description: newMcp.description,
      type: newMcp.type,
      command: newMcp.type === "local" ? newMcp.command : "",
      url: newMcp.type === "remote" ? newMcp.url : "",
      apiKey: newMcp.type === "remote" ? newMcp.apiKey : "",
      enabled: true,
    });

    // 保存MCP配置
    saveMcpServices(mcpServices);

    // 重置表单
    newMcp = {
      name: "",
      description: "",
      type: "local",
      command: "",
      url: "",
      apiKey: "",
      showApiKey: false,
    };
    showAddMcpModal = false;
  }

  function deleteModel(category, modelId) {
    models[category] = models[category].filter((m) => m.id !== modelId);

    // 如果删除的是默认嵌入模型，清空设置
    if (defaultEmbeddingModel === modelId.toString()) {
      defaultEmbeddingModel = "";
      saveEmbeddingModel("");
    }

    // 保存模型配置
    saveModels(models);
  }

  function deleteMcp(mcpId) {
    mcpServices = mcpServices.filter((m) => m.id !== mcpId);
    saveMcpServices(mcpServices);
  }

  function toggleModelEnabled(category, modelId) {
    const model = models[category].find((m) => m.id === modelId);
    if (model) {
      model.enabled = !model.enabled;

      // 如果禁用的是默认嵌入模型，清空设置
      if (!model.enabled && defaultEmbeddingModel === modelId.toString()) {
        defaultEmbeddingModel = "";
        saveEmbeddingModel("");
      }

      saveModels(models);
    }
  }

  function toggleMcpEnabled(mcpId) {
    const mcp = mcpServices.find((m) => m.id === mcpId);
    if (mcp) {
      mcp.enabled = !mcp.enabled;
      saveMcpServices(mcpServices);
    }
  }

  function onLanguageChange() {
    if (!isLoading) {
      saveLanguage(currentLanguage);
    }
  }

  function onAndroidNameChange() {
    if (!isLoading) {
      saveAndroidName(androidName);
    }
  }

  function onAndroidGoalChange() {
    if (!isLoading) {
      saveAndroidGoal(androidGoal);
    }
  }

  function onEmbeddingModelChange() {
    if (!isLoading) {
      saveEmbeddingModel(defaultEmbeddingModel);
    }
  }

  function toggleApiKeyVisibility() {
    newModel.showApiKey = !newModel.showApiKey;
  }

  function toggleMcpApiKeyVisibility() {
    newMcp.showApiKey = !newMcp.showApiKey;
  }

  // 获取分类中的模型数量
  function getModelCount(category) {
    return models[category]?.length || 0;
  }

  // 获取分类中启用的模型数量
  function getEnabledModelCount(category) {
    return models[category]?.filter((m) => m.enabled).length || 0;
  }

  // 获取MCP启用数量
  function getEnabledMcpCount() {
    return mcpServices.filter((m) => m.enabled).length;
  }

  // 动态组件渲染函数
  function getCategoryIcon(category) {
    return modelCategories[category]?.icon;
  }

  // 获取当前选中的模型信息
  function getSelectedModel() {
    if (!selectedSubSection || !selectedSubSection.startsWith("model-"))
      return null;
    const [, categoryKey, modelId] = selectedSubSection.split("-");
    return models[categoryKey]?.find((m) => m.id === parseInt(modelId));
  }

  // 获取当前选中模型的分类
  function getSelectedCategory() {
    if (!selectedSubSection || !selectedSubSection.startsWith("model-"))
      return null;
    return selectedSubSection.split("-")[1];
  }

  // 获取当前选中的MCP信息
  function getSelectedMcp() {
    if (!selectedSubSection || !selectedSubSection.startsWith("mcp-"))
      return null;
    const mcpId = selectedSubSection.split("-")[1];
    return mcpServices.find((m) => m.id === parseInt(mcpId));
  }

  // 检查模型是否不支持嵌入
  function hasNoEmbedding(modelName) {
    const preset = presetModels[modelName];
    return preset && preset.noEmbed;
  }
</script>

{#if isLoading}
  <!-- 加载状态 -->
  <div
    class="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center"
  >
    <div class="text-center">
      <IconLoading class="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <p class="text-lg text-gray-600 dark:text-gray-400">加载设置中...</p>
    </div>
  </div>
{:else}
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 左侧导航 -->
    <div
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"
      style="width: {$sidebarWidth}px"
    >
      <div class="p-6">
        <h1
          class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3"
        >
          <IconSettings class="text-blue-500" />
          设置
        </h1>
      </div>

      <nav class="px-4 pb-6">
        <!-- 一般设置 -->
        <div class="mb-6">
          <button
            onclick={() => selectSection("general")}
            class="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 {selectedSection ===
            'general'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300'}"
          >
            <IconGeneral />
            一般设置
          </button>
        </div>

        <!-- 模型设置 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <div
              class="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white"
            >
              <IconModel />
              模型
            </div>
            <button
              onclick={() => (showAddModal = true)}
              class="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 group"
            >
              <IconAdd
                class="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
              />
            </button>
          </div>

          {#each Object.entries(modelCategories) as [categoryKey, category]}
            <div class="mb-2">
              <button
                onclick={() => toggleCategory(categoryKey)}
                class="w-full flex items-center justify-between px-4 py-2 text-left rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <div class="flex items-center gap-3">
                  {#if getCategoryIcon(categoryKey)}
                    {#each [getCategoryIcon(categoryKey)] as IconComponent}
                      <IconComponent class="w-4 h-4" />
                    {/each}
                  {/if}
                  {category.name}
                  <span
                    class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full"
                  >
                    {getEnabledModelCount(categoryKey)}/{getModelCount(
                      categoryKey,
                    )}
                  </span>
                </div>
                <IconChevronDown
                  class="w-4 h-4 transition-transform duration-200 {expandedCategories.has(
                    categoryKey,
                  )
                    ? 'rotate-180'
                    : ''}"
                />
              </button>

              {#if expandedCategories.has(categoryKey)}
                <div
                  transition:slide={{ duration: 300 }}
                  class="ml-6 mt-2 space-y-1"
                >
                  {#if getModelCount(categoryKey) > 0}
                    {#each models[categoryKey] as model}
                      <div
                        class="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 {selectedSubSection ===
                        `model-${categoryKey}-${model.id}`
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : ''}"
                      >
                        <!-- 启用/禁用按钮 -->
                        <button
                          onclick={() =>
                            toggleModelEnabled(categoryKey, model.id)}
                          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title={model.enabled ? "禁用模型" : "启用模型"}
                        >
                          {#if model.enabled}
                            <IconPower class="w-3 h-3 text-green-500" />
                          {:else}
                            <IconPowerOff class="w-3 h-3 text-gray-400" />
                          {/if}
                        </button>

                        <!-- 模型信息 -->
                        <button
                          onclick={() =>
                            selectSection(
                              "model",
                              `model-${categoryKey}-${model.id}`,
                            )}
                          class="flex-1 text-left"
                        >
                          <div class="text-sm">
                            <div
                              class="font-medium flex items-center gap-2 {model.enabled
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'}"
                            >
                              {model.name}
                              {#if hasNoEmbedding(model.name)}
                                <span
                                  class="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-1 rounded"
                                >
                                  无嵌入
                                </span>
                              {/if}
                            </div>
                            <div
                              class="text-xs opacity-75 {model.enabled
                                ? 'text-gray-600 dark:text-gray-400'
                                : 'text-gray-400 dark:text-gray-500'}"
                            >
                              {model.provider}
                            </div>
                          </div>
                        </button>
                      </div>
                    {/each}
                  {:else}
                    <div class="px-3 py-4 text-center">
                      <p class="text-xs text-gray-400 dark:text-gray-500">
                        暂无模型
                      </p>
                      <button
                        onclick={() => (showAddModal = true)}
                        class="text-xs text-blue-500 hover:text-blue-600 mt-1"
                      >
                        点击添加
                      </button>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- MCP设置 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <div
              class="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white"
            >
              <IconMcp />
              MCP
              <span
                class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full"
              >
                {getEnabledMcpCount()}/{mcpServices.length}
              </span>
            </div>
            <button
              onclick={() => (showAddMcpModal = true)}
              class="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 group"
            >
              <IconAdd
                class="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
              />
            </button>
          </div>

          <div class="space-y-1">
            {#if mcpServices.length > 0}
              {#each mcpServices as mcp}
                <div
                  class="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 {selectedSubSection ===
                  `mcp-${mcp.id}`
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : ''}"
                >
                  <!-- 启用/禁用按钮 -->
                  <button
                    onclick={() => toggleMcpEnabled(mcp.id)}
                    class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={mcp.enabled ? "禁用服务" : "启用服务"}
                  >
                    {#if mcp.enabled}
                      <IconPower class="w-3 h-3 text-green-500" />
                    {:else}
                      <IconPowerOff class="w-3 h-3 text-gray-400" />
                    {/if}
                  </button>

                  <!-- MCP信息 -->
                  <button
                    onclick={() => selectSection("mcp", `mcp-${mcp.id}`)}
                    class="flex-1 text-left"
                  >
                    <div class="text-sm">
                      <div
                        class="font-medium flex items-center gap-2 {mcp.enabled
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-500'}"
                      >
                        {mcp.name}
                        {#if mcp.type === "remote"}
                          <IconCloud class="w-3 h-3" />
                        {:else}
                          <IconDesktop class="w-3 h-3" />
                        {/if}
                      </div>
                      <div
                        class="text-xs opacity-75 {mcp.enabled
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-500'}"
                      >
                        {mcp.description}
                      </div>
                    </div>
                  </button>
                </div>
              {/each}
            {:else}
              <div class="px-3 py-4 text-center">
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  暂无MCP服务
                </p>
                <button
                  onclick={() => (showAddMcpModal = true)}
                  class="text-xs text-blue-500 hover:text-blue-600 mt-1"
                >
                  点击添加
                </button>
              </div>
            {/if}
          </div>
        </div>
      </nav>
    </div>

    <!-- 右侧内容 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-8" style="opacity: {$contentOpacity}">
        {#if selectedSection === "general"}
          <div in:fly={{ x: 20, duration: 300 }}>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              一般设置
            </h2>

            <div class="space-y-6">
              <!-- 语言设置 -->
              <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
                >
                  <IconGeneral class="text-blue-500" />
                  基础配置
                </h3>

                <div class="space-y-4">
                  <!-- 语言设置 -->
                  <div class="flex items-center gap-4">
                    <span
                      class="text-gray-700 dark:text-gray-300 min-w-0 flex-1 flex items-center gap-2"
                    >
                      母语
                      <button
                        onmouseenter={() => (showLanguageHelp = true)}
                        onmouseleave={() => (showLanguageHelp = false)}
                        onkeydown={(e) =>
                          e.key === "Enter" &&
                          (showLanguageHelp = !showLanguageHelp)}
                        class="relative"
                        tabindex="0"
                      >
                        <IconHelp
                          class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        />
                        {#if showLanguageHelp}
                          <div
                            class="absolute left-6 top-0 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10"
                            transition:fly={{ y: -10, duration: 200 }}
                          >
                            这不是界面语言，而是本体语言，本体当前不支持跨语言，启动后不要切换
                          </div>
                        {/if}
                      </button>
                      ：
                    </span>
                    <select
                      bind:value={currentLanguage}
                      onchange={onLanguageChange}
                      class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-w-[120px]"
                    >
                      {#each languages as language}
                        <option value={language.code}>{language.name}</option>
                      {/each}
                    </select>
                  </div>

                  <!-- 名称设置 -->
                  <div class="flex items-center gap-4">
                    <span
                      class="text-gray-700 dark:text-gray-300 min-w-0 flex-1 flex items-center gap-2"
                    >
                      名称
                      <button
                        onmouseenter={() => (showNameHelp = true)}
                        onmouseleave={() => (showNameHelp = false)}
                        onkeydown={(e) =>
                          e.key === "Enter" && (showNameHelp = !showNameHelp)}
                        class="relative"
                        tabindex="0"
                      >
                        <IconHelp
                          class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        />
                        {#if showNameHelp}
                          <div
                            class="absolute left-6 top-0 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10"
                            transition:fly={{ y: -10, duration: 200 }}
                          >
                            此人造人的名字
                          </div>
                        {/if}
                      </button>
                      ：
                    </span>
                    <input
                      type="text"
                      bind:value={androidName}
                      onchange={onAndroidNameChange}
                      class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-w-[200px]"
                      placeholder="指挥官"
                    />
                  </div>

                  <!-- 目标设置 -->
                  <div class="flex items-center gap-4">
                    <span
                      class="text-gray-700 dark:text-gray-300 min-w-0 flex-1 flex items-center gap-2"
                    >
                      目标
                      <button
                        onmouseenter={() => (showGoalHelp = true)}
                        onmouseleave={() => (showGoalHelp = false)}
                        onkeydown={(e) =>
                          e.key === "Enter" && (showGoalHelp = !showGoalHelp)}
                        class="relative"
                        tabindex="0"
                      >
                        <IconHelp
                          class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        />
                        {#if showGoalHelp}
                          <div
                            class="absolute left-6 top-0 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10"
                            transition:fly={{ y: -10, duration: 200 }}
                          >
                            此人造人的目标
                          </div>
                        {/if}
                      </button>
                      ：
                    </span>
                    <input
                      type="text"
                      bind:value={androidGoal}
                      onchange={onAndroidGoalChange}
                      class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-w-[200px]"
                      placeholder="忠实执行使用者指令"
                    />
                  </div>
                </div>
              </div>

              <!-- 默认嵌入模型 -->
              <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
                >
                  <IconModel class="text-blue-500" />
                  默认嵌入模型
                  <button
                    onmouseenter={() => (showEmbeddingHelp = true)}
                    onmouseleave={() => (showEmbeddingHelp = false)}
                    onkeydown={(e) =>
                      e.key === "Enter" &&
                      (showEmbeddingHelp = !showEmbeddingHelp)}
                    class="relative"
                    tabindex="0"
                  >
                    <IconHelp
                      class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    />
                    {#if showEmbeddingHelp}
                      <div
                        class="absolute left-6 top-0 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10"
                        transition:fly={{ y: -10, duration: 200 }}
                      >
                        语义搜索使用的嵌入模型，如果未给定，本体会拆分至全文检索可解的程度
                      </div>
                    {/if}
                  </button>
                </h3>

                <div class="flex items-center gap-4">
                  <span class="text-gray-700 dark:text-gray-300 min-w-0 flex-1">
                    选择模型：
                  </span>
                  <select
                    bind:value={defaultEmbeddingModel}
                    onchange={onEmbeddingModelChange}
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-w-[200px]"
                    disabled={embeddingModels.length === 0}
                  >
                    <option value="">请选择嵌入模型</option>
                    {#each embeddingModels as model}
                      <option value={model.id}>{model.name}</option>
                    {/each}
                  </select>
                </div>
                {#if embeddingModels.length === 0}
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    请先添加支持嵌入的大语言模型
                  </p>
                {/if}
              </div>
            </div>
          </div>
        {:else if selectedSection === "model"}
          <div in:fly={{ x: 20, duration: 300 }}>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              模型设置
            </h2>

            {#if selectedSubSection}
              {#if getSelectedModel()}
                {#each [getSelectedModel()] as model}
                  {#each [getSelectedCategory()] as categoryKey}
                    <div
                      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div class="flex items-center justify-between mb-6">
                        <div>
                          <h3
                            class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                          >
                            {model.name}
                            {#if model.enabled}
                              <IconPower class="w-5 h-5 text-green-500" />
                            {:else}
                              <IconPowerOff class="w-5 h-5 text-gray-400" />
                              <span class="text-sm text-gray-500">已禁用</span>
                            {/if}
                            {#if hasNoEmbedding(model.name)}
                              <span
                                class="text-sm bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded"
                              >
                                无嵌入支持
                              </span>
                            {/if}
                          </h3>
                          <p class="text-gray-600 dark:text-gray-400">
                            {model.provider}
                          </p>
                        </div>
                        <div class="flex gap-3">
                          <button
                            onclick={() =>
                              toggleModelEnabled(categoryKey, model.id)}
                            class="px-4 py-2 {model.enabled
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                          >
                            {#if model.enabled}
                              <IconPowerOff class="w-4 h-4" />
                              禁用模型
                            {:else}
                              <IconPower class="w-4 h-4" />
                              启用模型
                            {/if}
                          </button>
                          <button
                            onclick={() => deleteModel(categoryKey, model.id)}
                            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                          >
                            删除模型
                          </button>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 gap-6">
                        <!-- API Key -->
                        <div>
                          <label
                            for={`api-key-${model.id}`}
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            API Key
                          </label>
                          <div class="relative">
                            <input
                              id={`api-key-${model.id}`}
                              type={newModel.showApiKey ? "text" : "password"}
                              value={model.apiKey}
                              readonly
                              class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              onclick={toggleApiKeyVisibility}
                              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {#if newModel.showApiKey}
                                <IconEyeOff class="w-4 h-4" />
                              {:else}
                                <IconEye class="w-4 h-4" />
                              {/if}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                {/each}
              {/if}
            {:else}
              <div class="text-center py-12">
                <IconModel class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p class="text-gray-500 dark:text-gray-400">
                  请选择一个模型进行配置
                </p>
              </div>
            {/if}
          </div>
        {:else if selectedSection === "mcp"}
          <div in:fly={{ x: 20, duration: 300 }}>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              MCP设置
            </h2>

            {#if selectedSubSection}
              {#if getSelectedMcp()}
                {#each [getSelectedMcp()] as mcp}
                  <div
                    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div class="flex items-center justify-between mb-6">
                      <div>
                        <h3
                          class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                        >
                          {mcp.name}
                          {#if mcp.type === "remote"}
                            <IconCloud class="w-5 h-5 text-blue-500" />
                          {:else}
                            <IconDesktop class="w-5 h-5 text-green-500" />
                          {/if}
                          {#if mcp.enabled}
                            <IconPower class="w-5 h-5 text-green-500" />
                          {:else}
                            <IconPowerOff class="w-5 h-5 text-gray-400" />
                            <span class="text-sm text-gray-500">已禁用</span>
                          {/if}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400">
                          {mcp.description}
                        </p>
                      </div>
                      <div class="flex gap-3">
                        <button
                          onclick={() => toggleMcpEnabled(mcp.id)}
                          class="px-4 py-2 {mcp.enabled
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          {#if mcp.enabled}
                            <IconPowerOff class="w-4 h-4" />
                            禁用服务
                          {:else}
                            <IconPower class="w-4 h-4" />
                            启用服务
                          {/if}
                        </button>
                        <button
                          onclick={() => deleteMcp(mcp.id)}
                          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                        >
                          删除服务
                        </button>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 gap-6">
                      <div class="grid grid-cols-2 gap-4">
                        <!-- 类型 -->
                        <div>
                          <label
                            for=""
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            类型
                          </label>
                          <div
                            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white flex items-center gap-2"
                          >
                            {#if mcp.type === "remote"}
                              <IconCloud class="w-4 h-4 text-blue-500" />
                              远端
                            {:else}
                              <IconDesktop class="w-4 h-4 text-green-500" />
                              本地
                            {/if}
                          </div>
                        </div>
                      </div>

                      <!-- 根据类型显示不同配置 -->
                      {#if mcp.type === "local"}
                        <div>
                          <label
                            for="mcpCommand"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            命令
                          </label>
                          <input
                            id="mcpCommand"
                            type="text"
                            value={mcp.command}
                            readonly
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      {:else}
                        <div class="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              for="mcp_url"
                              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              URL
                            </label>
                            <input
                              id="mcp_url"
                              type="text"
                              value={mcp.url}
                              readonly
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label
                              id="mcp_showapiKey"
                              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              API Key
                            </label>
                            <div class="relative">
                              <input
                                id="mcp_showapiKey"
                                type={newMcp.showApiKey ? "text" : "password"}
                                value={mcp.apiKey}
                                readonly
                                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                onclick={toggleMcpApiKeyVisibility}
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {#if newMcp.showApiKey}
                                  <IconEyeOff class="w-4 h-4" />
                                {:else}
                                  <IconEye class="w-4 h-4" />
                                {/if}
                              </button>
                            </div>
                          </div>


                          
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              {/if}
            {:else}
              <div class="text-center py-12">
                <IconMcp class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p class="text-gray-500 dark:text-gray-400">
                  请选择一个MCP服务进行配置
                </p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- 添加模型弹窗 -->
  {#if showAddModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      transition:fly={{ y: 20, duration: 300 }}
      onclick={(e) => e.target === e.currentTarget && (showAddModal = false)}
      onkeydown={(e) => e.key === "Escape" && (showAddModal = false)}
      role="dialog"
      tabindex="-1"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
        transition:fly={{ y: 20, duration: 300 }}
      >
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          添加新模型
        </h3>

        <div class="space-y-4">
          <div>
            <label
              for="model-select"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              选择模型
            </label>
            <select
              id="model-select"
              bind:value={newModel.name}
              onchange={onModelSelect}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">请选择模型</option>
              {#each Object.keys(presetModels) as modelName}
                <option value={modelName}>{modelName}</option>
              {/each}
            </select>
          </div>

          {#if newModel.name && presetModels[newModel.name]}
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="text-sm">
                <div class="font-medium text-gray-900 dark:text-white">
                  提供商: {presetModels[newModel.name].provider}
                </div>
                <div class="text-gray-600 dark:text-gray-400">
                  类型: {modelCategories[presetModels[newModel.name].category]
                    .name}
                </div>
                {#if hasNoEmbedding(newModel.name)}
                  <div
                    class="text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1"
                  >
                    <span
                      class="text-xs bg-orange-100 dark:bg-orange-900 px-1 rounded"
                      >无嵌入支持</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          {#if newModel.name}
            <!-- API Key -->
            <div>
              <label
                for="api-key-input"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Key
              </label>
              <div class="relative">
                <input
                  id="api-key-input"
                  type={newModel.showApiKey ? "text" : "password"}
                  bind:value={newModel.apiKey}
                  class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="输入API Key"
                />
                <button
                  onclick={toggleApiKeyVisibility}
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {#if newModel.showApiKey}
                    <IconEyeOff class="w-4 h-4" />
                  {:else}
                    <IconEye class="w-4 h-4" />
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </div>

        <div class="flex gap-3 mt-6">
          <button
            onclick={() => (showAddModal = false)}
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            取消
          </button>
          <button
            onclick={addModel}
            disabled={!newModel.name || !newModel.apiKey}
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- 添加MCP弹窗 -->
  {#if showAddMcpModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      transition:fly={{ y: 20, duration: 300 }}
      onclick={(e) => e.target === e.currentTarget && (showAddMcpModal = false)}
      onkeydown={(e) => e.key === "Escape" && (showAddMcpModal = false)}
      role="dialog"
      tabindex="-1"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
        transition:fly={{ y: 20, duration: 300 }}
      >
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          添加MCP服务
        </h3>

        <div class="space-y-4">
          <!-- 名称 -->
          <div>
            <label
              for="mcp-name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              名称
            </label>
            <input
              id="mcp-name"
              type="text"
              bind:value={newMcp.name}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入服务名称"
            />
          </div>

          <!-- 功能简介 -->
          <div>
            <label
              for="mcp-description"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              功能简介
            </label>
            <textarea
              id="mcp-description"
              bind:value={newMcp.description}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="描述此服务的功能"
            ></textarea>
          </div>

          <!-- 类型选择 -->
          <div>
            <label
              for="mcp-type"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              类型
            </label>
            <select
              id="mcp-type"
              bind:value={newMcp.type}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="local">本地</option>
              <option value="remote">远端</option>
            </select>
          </div>

          <!-- 根据类型显示不同配置 -->
          {#if newMcp.type === "local"}
            <div>
              <label
                for="mcp-command"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                命令及参数
              </label>
              <input
                id="mcp-command"
                type="text"
                bind:value={newMcp.command}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="输入执行命令，如: python script.py --arg"
              />
            </div>
          {:else}
            <div class="grid grid-cols-2 gap-4">
              <!-- URL -->
              <div>
                <label
                  for="mcp-url"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  URL路径
                </label>
                <input
                  id="mcp-url"
                  type="url"
                  bind:value={newMcp.url}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://api.example.com"
                />
              </div>
              <!-- API Key -->
              <div>
                <label
                  for="mcp-api-key"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  API Key
                </label>
                <div class="relative">
                  <input
                    id="mcp-api-key"
                    type={newMcp.showApiKey ? "text" : "password"}
                    bind:value={newMcp.apiKey}
                    class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="输入API Key"
                  />
                  <button
                    onclick={toggleMcpApiKeyVisibility}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {#if newMcp.showApiKey}
                      <IconEyeOff class="w-4 h-4" />
                    {:else}
                      <IconEye class="w-4 h-4" />
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <div class="flex gap-3 mt-6">
          <button
            onclick={() => (showAddMcpModal = false)}
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            取消
          </button>
          <button
            onclick={addMcp}
            disabled={!newMcp.name ||
              !newMcp.description ||
              (newMcp.type === "local" && !newMcp.command) ||
              (newMcp.type === "remote" && (!newMcp.url || !newMcp.apiKey))}
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}
