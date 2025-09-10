// lib/events/types.ts

// export const DAISYUI_THEMES = {
//   // 🌝 Light themes
//   light: 'light',
//   cupcake: 'cupcake',
//   bumblebee: 'bumblebee',
//   emerald: 'emerald',
//   corporate: 'corporate',
//   retro: 'retro',
//   cyberpunk: 'cyberpunk',
//   valentine: 'valentine',
//   garden: 'garden',
//   aqua: 'aqua',
//   lofi: 'lofi',
//   pastel: 'pastel',
//   fantasy: 'fantasy',
//   wireframe: 'wireframe',
//   cmyk: 'cmyk',
//   autumn: 'autumn',
//   acid: 'acid',
//   lemonade: 'lemonade',
//   winter: 'winter',

//   // 🌚 Dark themes
//   dark: 'dark',
//   forest: 'forest',
//   black: 'black',
//   luxury: 'luxury',
//   dracula: 'dracula',
//   business: 'business',
//   night: 'night',
//   coffee: 'coffee',
//   dim: 'dim',
//   sunset: 'sunset',
//   synthwave: 'synthwave',
// } as const;

// export type DaisyUITheme = typeof DAISYUI_THEMES[keyof typeof DAISYUI_THEMES];

export interface StorageEvent {
  key: string | null;
  newValue: string | null;
  oldValue: string | null;
}

export interface Events {
  'storage': StorageEvent;
  // 'theme:changed': DaisyUITheme;
  [key: string | symbol]: unknown; 
}