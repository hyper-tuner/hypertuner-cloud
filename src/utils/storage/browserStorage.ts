import { StorageInterface } from '../storageInterface';

class BrowserStorage implements StorageInterface {
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

  public async isAvailable(): Promise<boolean> {
    return !!this.storage;
  }
}

export default BrowserStorage;
