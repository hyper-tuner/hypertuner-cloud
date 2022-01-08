import BrowserStorage from './storage/BrowserStorage';
import { StorageInterface } from './StorageInterface';

class Storage {
  private storage: StorageInterface;

  public constructor() {
    this.storage = new BrowserStorage();
  }

  public get(key: string) {
    return this.storage.get(key);
  }

  public getSync(key: string) {
    return this.storage.getSync(key);
  }

  public set(key: string, value: string) {
    return this.storage.set(key, value);
  }

  public delete(key: string) {
    return this.storage.delete(key);
  }
}

export default Storage;
