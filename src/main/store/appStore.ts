import Store from 'electron-store';
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../themes';

interface StoreSchema {
  lastProjectPath: string;
  lastFilePath: string;
  theme: string;
}

const store = new Store<StoreSchema>({
  name: 'pseudo-config',
  defaults: {
    lastProjectPath: '',
    lastFilePath: '',
    theme: DEFAULT_THEME,
  },
});

export function getLastProjectPath(): string {
  return store.get('lastProjectPath');
}

export function setLastProjectPath(path: string): void {
  store.set('lastProjectPath', path);
}

export function clearLastProjectPath(): void {
  store.delete('lastProjectPath');
}

export function getLastFilePath(): string {
  return store.get('lastFilePath');
}

export function setLastFilePath(path: string): void {
  store.set('lastFilePath', path);
}

export function clearLastFilePath(): void {
  store.delete('lastFilePath');
}

export function getThemeId(): ThemeId {
  const raw = store.get('theme');
  return isThemeId(raw) ? raw : DEFAULT_THEME;
}

export function setThemeId(theme: ThemeId): void {
  store.set('theme', theme);
}
