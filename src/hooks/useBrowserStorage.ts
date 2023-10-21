import { useMemo } from 'react';

class BrowserStorage {
  private storage: Storage;

  public constructor() {
    this.storage = window.localStorage;
  }

  public async get(key: string): Promise<string | null> {
    await Promise.resolve();
    return this.storage.getItem(key);
  }

  public getSync(key: string): string | null {
    return this.storage.getItem(key);
  }

  public async set(key: string, value: string): Promise<void> {
    await Promise.resolve();
    this.storage.setItem(key, value);
  }

  public delete(key: string): void {
    this.storage.removeItem(key);
  }

  public isAvailable() {
    return !!this.storage;
  }
}

const useBrowserStorage = () => {
  const storage = useMemo(() => new BrowserStorage(), []);

  return {
    storageGet: (key: string) => storage.get(key),
    storageGetSync: (key: string) => storage.getSync(key),
    storageSet: (key: string, value: string) => storage.set(key, value),
    storageDelete: (key: string) => {
      storage.delete(key);
    },
  };
};

export default useBrowserStorage;
