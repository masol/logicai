
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { eventBus } from '$lib/utils/evtbus';

export const THEME = {
  LIGHT: 'cupcake',
  DARK: 'dim'
} as const;

export type Theme = typeof THEME[keyof typeof THEME];

const createThemeStore = () => {
  const { subscribe, set, update } = writable<Theme>(THEME.LIGHT);

  async function init() {
    if (browser) {
      const initialTheme = browser ? localStorage.getItem('theme') as Theme || THEME.LIGHT : THEME.LIGHT;
      document.documentElement.setAttribute('data-theme', initialTheme);
      set(initialTheme);
    }
  }

  eventBus.on('storage', (event) => {
    if (event.key === 'theme' && event.newValue) {
      const newTheme = event.newValue as Theme;
      document.documentElement.setAttribute('data-theme', newTheme);
      set(newTheme);
    }
  });

  init();

  return {
    subscribe,
    toggle: () => {
      update(current => {
        const newTheme = current === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
        if (browser) {
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
        }
        return newTheme;
      });
    },
    isDark: (theme: Theme) => theme === THEME.DARK
  };
};

export const theme = createThemeStore();
