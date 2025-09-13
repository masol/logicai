<!-- Header.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    breadcrumbStore,
    type BreadcrumbItem,
  } from "$lib/stores/breadcrumb.svelte";
  import { theme, THEME } from "$lib/stores/theme";
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

  let isMenuOpen = $state(false);
  let isScrolled = $state(false);
  let isSettingsOpen = $state(false);
  let headerElement = $state<HTMLElement>();

  // 主菜单项配置
  const menuItems = [
    { label: "首页", href: "/", icon: IconChat },
    { label: "产品", href: "/products", icon: IconPackage },
    { label: "服务", href: "/services", icon: IconCog },
    { label: "关于", href: "/about", icon: IconInfo },
    { label: "联系", href: "/contact", icon: IconEmail },
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
    goto("/");
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
    theme.toggle();
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

<header
  bind:this={headerElement}
  class="navbar fixed top-0 left-0 right-0 z-50 bg-base-100/85 backdrop-blur-md border-b border-base-content/10 transition-all duration-300 ease-out {isScrolled
    ? 'bg-base-100/95 shadow-lg border-base-content/20'
    : 'shadow-sm'}"
>
  <!-- 主导航栏 -->
  <div class="navbar-start min-w-0">
    <!-- 品牌Logo -->
    <button
      onclick={goHome}
      class="btn btn-ghost p-2 mr-4 hover:scale-105 transition-all duration-300 group"
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
          品牌名
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
                <span class="badge badge-outline badge-lg font-medium">
                  {crumb.label}
                </span>
              {:else if crumb.href}
                <button
                  onclick={() => handleBreadcrumbClick(crumb.href)}
                  class="btn btn-ghost btn-sm hover:scale-105 transition-all duration-200"
                >
                  {crumb.label}
                </button>
              {:else}
                <span class="text-base-content/70">
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
              class="btn btn-ghost btn-sm flex items-center space-x-2 hover:scale-105 focus:scale-105 transition-all duration-300 {isActive(
                item.href,
              )
                ? 'btn-primary'
                : ''}"
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
        class="btn btn-ghost btn-circle hover:scale-110 transition-all duration-300 {isSettingsOpen
          ? 'btn-active'
          : ''}"
        aria-label="设置菜单"
        aria-expanded={isSettingsOpen}
        aria-haspopup="true"
      >
        <IconSettings
          class="w-5 h-5 transition-all duration-300 {isSettingsOpen
            ? 'rotate-90 text-primary'
            : 'hover:rotate-45'}"
        />
      </button>

      {#if isSettingsOpen}
        <div
          class="absolute right-0 top-full mt-2 card card-compact w-64 p-2 shadow-xl bg-base-100 border border-base-content/10 z-50"
          in:scale={{ duration: 200, start: 0.9 }}
          out:scale={{ duration: 150, start: 0.9 }}
          role="menu"
          aria-labelledby="settings-button"
        >
          <div class="card-body">
            <h3 class="card-title text-sm">设置</h3>

            <div class="divider my-1"></div>

            <!-- 主题切换 -->
            <button
              onclick={handleThemeToggle}
              onkeydown={(e) => handleKeyDown(e, handleThemeToggle)}
              class="btn btn-ghost justify-start space-x-3 w-full hover:btn-primary/10 transition-all duration-200"
              role="menuitem"
            >
              <div class="flex items-center space-x-3 flex-1">
                {#if $theme === THEME.DARK}
                  <IconThemeDark class="w-4 h-4 text-warning" />
                  <span class="text-sm">夜晚模式</span>
                {:else}
                  <IconThemeLight class="w-4 h-4 text-warning" />
                  <span class="text-sm">白天模式</span>
                {/if}
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary toggle-sm pointer-events-none"
                checked={$theme === THEME.DARK}
                readonly
                tabindex="-1"
              />
            </button>

            <div class="divider my-1"></div>

            <!-- 系统设置 -->
            <button
              onclick={handleSystemSettings}
              onkeydown={(e) => handleKeyDown(e, handleSystemSettings)}
              class="btn btn-ghost justify-between w-full hover:btn-primary/10 transition-all duration-200"
              role="menuitem"
            >
              <div class="flex items-center space-x-3">
                <IconCog class="w-4 h-4" />
                <span class="text-sm">系统设置</span>
              </div>
              <IconChevronRight class="w-3 h-3 opacity-50" />
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- 移动端菜单按钮 -->
    <button
      onclick={toggleMenu}
      class="btn btn-ghost btn-circle lg:hidden hover:scale-110 transition-all duration-300"
      aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
      aria-expanded={isMenuOpen}
    >
      <div class="relative w-6 h-6">
        <IconMenu
          class="absolute inset-0 w-6 h-6 transition-all duration-300 {isMenuOpen
            ? 'rotate-180 opacity-0'
            : 'rotate-0 opacity-100'}"
        />
        <IconClose
          class="absolute inset-0 w-6 h-6 transition-all duration-300 {isMenuOpen
            ? 'rotate-0 opacity-100'
            : 'rotate-180 opacity-0'}"
        />
      </div>
    </button>
  </div>
</header>

<!-- 移动端面包屑 -->
{#if breadcrumbsLength > 0}
  <div
    class="lg:hidden px-4 py-3 bg-base-200/80 backdrop-blur border-b border-base-content/10 fixed top-16 left-0 right-0 z-40"
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
              <span class="badge badge-primary badge-sm">
                {crumb.label}
              </span>
            {:else if crumb.href}
              <button
                onclick={() => handleBreadcrumbClick(crumb.href)}
                class="btn btn-ghost btn-xs hover:btn-primary transition-all duration-200"
              >
                {crumb.label}
              </button>
            {:else}
              <span class="text-base-content/70 text-xs">
                {crumb.label}
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<!-- 移动端菜单 -->
<div
  class="drawer lg:hidden fixed top-0 left-0 w-full h-full z-40 pointer-events-none"
  class:pointer-events-auto={isMenuOpen}
>
  <input
    id="mobile-menu-drawer"
    type="checkbox"
    class="drawer-toggle"
    bind:checked={isMenuOpen}
  />

  <div class="drawer-side">
    <button
      class="drawer-overlay bg-black/50"
      onclick={closeAllMenus}
      onkeydown={(e) => handleKeyDown(e, closeAllMenus)}
      aria-label="关闭菜单"
    ></button>

    <div class="menu p-4 w-80 min-h-full bg-base-100 space-y-2">
      <!-- Logo区域 -->
      <div
        class="flex items-center space-x-3 p-4 border-b border-base-content/10 mb-4"
      >
        <IconChat class="w-8 h-8 text-primary" />
        <span class="text-xl font-bold">品牌名</span>
      </div>

      <!-- 主菜单项 -->
      {#each menuItems as item, index (item.href)}
        <li
          class="transform transition-all duration-300 {isMenuOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0'}"
          style="transition-delay: {index * 50}ms"
        >
          <button
            onclick={() => handleMenuClick(item.href)}
            onkeydown={(e) =>
              handleKeyDown(e, () => handleMenuClick(item.href))}
            class="btn btn-ghost justify-start w-full p-4 h-auto hover:btn-primary/10 transition-all duration-300 {isActive(
              item.href,
            )
              ? 'btn-primary'
              : ''}"
          >
            <div class="flex items-center space-x-4">
              {#if item.icon === IconChat}
                <IconChat class="w-5 h-5" />
              {:else if item.icon === IconPackage}
                <IconPackage class="w-5 h-5" />
              {:else if item.icon === IconCog}
                <IconCog class="w-5 h-5" />
              {:else if item.icon === IconInfo}
                <IconInfo class="w-5 h-5" />
              {:else if item.icon === IconEmail}
                <IconEmail class="w-5 h-5" />
              {/if}
              <span class="text-lg">{item.label}</span>
            </div>
          </button>
        </li>
      {/each}

      <!-- 设置区域 -->
      <div class="divider">设置</div>

      <!-- 主题切换 -->
      <li>
        <button
          onclick={handleThemeToggle}
          onkeydown={(e) => handleKeyDown(e, handleThemeToggle)}
          class="btn btn-ghost justify-start w-full p-4 h-auto hover:btn-primary/10 transition-all duration-300"
        >
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-4">
              {#if $theme === THEME.DARK}
                <IconThemeDark class="w-5 h-5 text-warning" />
                <span class="text-lg">夜晚模式</span>
              {:else}
                <IconThemeLight class="w-5 h-5 text-warning" />
                <span class="text-lg">白天模式</span>
              {/if}
            </div>
            <input
              type="checkbox"
              class="toggle toggle-primary pointer-events-none"
              checked={$theme === THEME.DARK}
              readonly
              tabindex="-1"
            />
          </div>
        </button>
      </li>

      <!-- 系统设置 -->
      <li>
        <button
          onclick={handleSystemSettings}
          onkeydown={(e) => handleKeyDown(e, handleSystemSettings)}
          class="btn btn-ghost justify-start w-full p-4 h-auto hover:btn-primary/10 transition-all duration-300"
        >
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-4">
              <IconCog class="w-5 h-5" />
              <span class="text-lg">系统设置</span>
            </div>
            <IconChevronRight class="w-4 h-4 opacity-50" />
          </div>
        </button>
      </li>
    </div>
  </div>
</div>

<!-- 占位元素 -->
<div class="h-16 {breadcrumbsLength > 0 ? 'lg:h-16 h-20' : ''}"></div>
