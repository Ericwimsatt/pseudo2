import Store from 'electron-store';

interface StoreSchema {
  lastProjectPath: string;
  lastFilePath: string;
}

const store = new Store<StoreSchema>({
  name: 'pseudo-config',
  defaults: {
    lastProjectPath: '',
    lastFilePath: '',
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
