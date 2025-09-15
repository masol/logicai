<!-- Header.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    breadcrumbStore,
    type BreadcrumbItem,
  } from "$lib/stores/breadcrumb.svelte";
  import { androidNameStore } from "$lib/stores/shared.svelte";
  import { fly, scale } from "svelte/transition";
  import { flip } from "svelte/animate";
  import IconChat from "~icons/mdi/chat-outline";
  import IconMenu from "~icons/mdi/menu";
  import IconClose from "~icons/mdi/close";
  import IconPackage from "~icons/mdi/package-variant";
  import IconCog from "~icons/mdi/cog";
  import IconInfo from "~icons/mdi/information";
  import IconEmail from "~icons/mdi/email";
  import IconChevronRight from "~icons/mdi/chevron-right";
  import IconSettings from "~icons/mdi/cog-outline";
  import IconThemeLight from "~icons/mdi/white-balance-sunny";
  import IconThemeDark from "~icons/mdi/weather-night";
  import { mode, toggleMode, setMode } from "mode-watcher";

  let isMenuOpen = $state(false);
  let isScrolled = $state(false);
  let isSettingsOpen = $state(false);
  let headerElement = $state<HTMLElement>();

  // 计算动态类名 - 支持dark/light主题
  const headerClasses = $derived(
    `navbar fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border transition-all duration-300 ease-out ${
      isScrolled
        ? "bg-background/95 dark:bg-background/95 shadow-lg dark:shadow-xl"
        : "bg-background/85 dark:bg-background/85 shadow-sm dark:shadow-md"
    }`,
  );

  // 主菜单项配置
  const menuItems = [
    // { label: "首页", href: "/", icon: IconChat },
    { label: "工作流", href: "/main/graph", icon: IconPackage },
    { label: "本体", href: "/main/editor", icon: IconCog },
    // { label: "关于", href: "/about", icon: IconInfo },
    // { label: "联系", href: "/contact", icon: IconEmail },
  ];

  const currentPath = $derived(page?.url?.pathname || "/");

  // 使用breadcrumbStore的面包屑数据
  const breadcrumbs = $derived(breadcrumbStore.value);
  const breadcrumbsLength = $derived(breadcrumbStore.length());

  function isActive(href: string): boolean {
    return currentPath === href;
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
      isSettingsOpen = false;
    }
  }

  function toggleSettings(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    isSettingsOpen = !isSettingsOpen;
    if (isSettingsOpen) {
      isMenuOpen = false;
    }
  }

  function closeAllMenus() {
    isMenuOpen = false;
    isSettingsOpen = false;
  }

  function goHome() {
    goto("/main/commander");
    closeAllMenus();
  }

  function handleMenuClick(href: string) {
    goto(href);
    closeAllMenus();
  }

  function handleBreadcrumbClick(href: string | undefined) {
    if (href) {
      goto(href);
    }
  }

  function handleThemeToggle() {
    toggleMode();
    // console.log("mode.current=", mode.current);
    localStorage.setItem("mode-watcher-mode", mode.current);
  }

  function handleSystemSettings() {
    goto("/main/settings");
    closeAllMenus();
  }

  function handleKeyDown(event: KeyboardEvent, callback: () => void) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  }

  onMount(() => {
    function handleScroll() {
      isScrolled = window.scrollY > 20;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && (isMenuOpen || isSettingsOpen)) {
        closeAllMenus();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (!headerElement?.contains(event.target as Node)) {
        closeAllMenus();
      }
    }

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
    };
  });

  $effect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  });
</script>

<header bind:this={headerElement} class={headerClasses}>
  <!-- 主导航栏 -->
  <div class="navbar-start min-w-0">
    <button
      onclick={goHome}
      class="btn btn-ghost p-2 mr-4 hover:scale-105 transition-all duration-300 group text-foreground hover:text-primary"
      aria-label="返回首页"
    >
      <div class="flex items-center space-x-2">
        <div class="relative">
          <IconChat
            class="w-8 h-8 text-primary transition-all duration-300 group-hover:rotate-12"
          />
          <div
            class="absolute inset-0 bg-primary/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500"
          ></div>
        </div>
        <span
          class="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block"
        >
          {androidNameStore.value}
        </span>
      </div>
    </button>

    <!-- 面包屑导航 -->
    {#if breadcrumbsLength > 0}
      <div class="breadcrumbs hidden lg:flex text-sm">
        <ul>
          {#each breadcrumbs as crumb, index (crumb.label + index)}
            <li
              animate:flip={{ duration: 300 }}
              in:scale={{ duration: 300, delay: index * 50 }}
              out:scale={{ duration: 200 }}
            >
              {#if index === breadcrumbs.length - 1}
                <span
                  class="badge badge-outline badge-lg font-medium text-foreground border-border"
                >
                  {crumb.label}
                </span>
              {:else if crumb.href}
                <button
                  onclick={() => handleBreadcrumbClick(crumb.href)}
                  class="btn btn-ghost btn-sm hover:scale-105 transition-all duration-200 text-muted-foreground hover:text-foreground"
                >
                  {crumb.label}
                </button>
              {:else}
                <span class="text-muted-foreground">
                  {crumb.label}
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <!-- 右侧：主菜单和设置 -->
  <div class="navbar-end flex items-center space-x-2">
    <!-- 桌面端主菜单 -->
    <nav class="hidden lg:flex" aria-label="主导航">
      <ul class="menu menu-horizontal px-1">
        {#each menuItems as item (item.href)}
          <li>
            <a
              href={item.href}
              class={`btn btn-ghost btn-sm flex items-center space-x-2 hover:scale-105 focus:scale-105 transition-all duration-300 text-foreground hover:text-primary ${
                isActive(item.href) ? "btn-primary text-primary-foreground" : ""
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {#if item.icon === IconChat}
                <IconChat class="w-4 h-4" />
              {:else if item.icon === IconPackage}
                <IconPackage class="w-4 h-4" />
              {:else if item.icon === IconCog}
                <IconCog class="w-4 h-4" />
              {:else if item.icon === IconInfo}
                <IconInfo class="w-4 h-4" />
              {:else if item.icon === IconEmail}
                <IconEmail class="w-4 h-4" />
              {/if}
              <span>{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <!-- 桌面端设置下拉菜单 -->
    <div class="relative hidden lg:block">
      <button
        onclick={(e) => toggleSettings(e)}
        onkeydown={(e) => handleKeyDown(e, () => toggleSettings())}
        class={`btn btn-ghost btn-circle hover:scale-110 transition-all duration-300 text-foreground hover:text-primary ${
          isSettingsOpen ? "btn-active bg-muted" : ""
        }`}
        aria-label="设置菜单"
        aria-expanded={isSettingsOpen}
        aria-haspopup="true"
      >
        <IconSettings
          class={`w-5 h-5 transition-all duration-300 ${
            isSettingsOpen ? "rotate-90 text-primary" : "hover:rotate-45"
          }`}
        />
      </button>

      {#if isSettingsOpen}
        <div
          class="absolute right-0 top-full mt-2 w-64 p-4 shadow-2xl bg-white dark:bg-gray-800 border border-border rounded-lg z-50"
          in:scale={{ duration: 200, start: 0.9 }}
          out:scale={{ duration: 150, start: 0.9 }}
          role="menu"
          aria-labelledby="settings-button"
        >
          <h3 class="text-sm font-semibold text-foreground mb-3">设置</h3>

          <div class="border-t border-border my-2"></div>

          <button
            onclick={handleThemeToggle}
            onkeydown={(e) => handleKeyDown(e, handleThemeToggle)}
            class="flex items-center justify-between w-full p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            role="menuitem"
          >
            <div class="flex items-center space-x-3">
              {#if mode.current === "light"}
                <IconThemeDark class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-foreground">夜晚模式</span>
              {:else}
                <IconThemeLight class="w-4 h-4 text-amber-600" />
                <span class="text-sm text-foreground">白天模式</span>
              {/if}
            </div>
            <input
              type="checkbox"
              class="toggle toggle-primary toggle-sm pointer-events-none"
              checked={mode.current === "light"}
              readonly
              tabindex="-1"
            />
          </button>

          <div class="border-t border-border my-2"></div>

          <!-- 系统设置 -->
          <button
            onclick={handleSystemSettings}
            onkeydown={(e) => handleKeyDown(e, handleSystemSettings)}
            class="flex items-center justify-between w-full p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            role="menuitem"
          >
            <div class="flex items-center space-x-3">
              <IconCog class="w-4 h-4 text-muted-foreground" />
              <span class="text-sm text-foreground">系统设置</span>
            </div>
            <IconChevronRight class="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      {/if}
    </div>

    <!-- 移动端菜单按钮 -->
    <button
      onclick={toggleMenu}
      class="btn btn-ghost btn-circle lg:hidden hover:scale-110 transition-all duration-300 text-foreground hover:text-primary"
      aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
      aria-expanded={isMenuOpen}
    >
      <div class="relative w-6 h-6">
        <IconMenu
          class={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
            isMenuOpen ? "rotate-180 opacity-0" : "rotate-0 opacity-100"
          }`}
        />
        <IconClose
          class={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
            isMenuOpen ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
          }`}
        />
      </div>
    </button>
  </div>
</header>

<!-- 移动端面包屑 -->
{#if breadcrumbsLength > 0}
  <div
    class="lg:hidden px-4 py-3 bg-muted/80 dark:bg-muted/80 backdrop-blur border-b border-border fixed top-16 left-0 right-0 z-40"
    in:fly={{ y: -20, duration: 400 }}
    out:fly={{ y: -20, duration: 300 }}
  >
    <div class="breadcrumbs text-sm overflow-x-auto">
      <ul>
        {#each breadcrumbs as crumb, index (crumb.label + index)}
          <li
            animate:flip={{ duration: 300 }}
            in:fly={{ x: -20, duration: 300, delay: index * 30 }}
            out:scale={{ duration: 200 }}
            class="whitespace-nowrap"
          >
            {#if index === breadcrumbs.length - 1}
              <span
                class="badge badge-primary badge-sm text-primary-foreground"
              >
                {crumb.label}
              </span>
            {:else if crumb.href}
              <button
                onclick={() => handleBreadcrumbClick(crumb.href)}
                class="btn btn-ghost btn-xs hover:btn-primary hover:text-primary-foreground transition-all duration-200 text-muted-foreground"
              >
                {crumb.label}
              </button>
            {:else}
              <span class="text-muted-foreground text-xs">
                {crumb.label}
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<!-- 占位元素 -->
<div class={`h-16 ${breadcrumbsLength > 0 ? "lg:h-16 h-20" : ""}`}></div>
