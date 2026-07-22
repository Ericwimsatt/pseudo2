import Store from 'electron-store';

interface StoreSchema {
  lastProjectPath: string;
}

const store = new Store<StoreSchema>({
  name: 'pseudo-config',
  defaults: {
    lastProjectPath: '',
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
