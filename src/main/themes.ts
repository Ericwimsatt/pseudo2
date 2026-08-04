export type ThemeId = 'light' | 'dark' | 'solarized-light' | 'solarized-dark' | 'dracula' | 'monokai';

export const THEME_IDS: ThemeId[] = [
  'light',
  'dark',
  'solarized-light',
  'solarized-dark',
  'dracula',
  'monokai',
];

export const DEFAULT_THEME: ThemeId = 'light';

export const THEME_LABELS: Record<ThemeId, string> = {
  light: 'Light',
  dark: 'Dark',
  'solarized-light': 'Solarized Light',
  'solarized-dark': 'Solarized Dark',
  dracula: 'Dracula',
  monokai: 'Monokai',
};

export function isThemeId(value: string): value is ThemeId {
  return value in THEME_LABELS;
}