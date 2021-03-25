import BrowserStorage from './storage/browserStorage';
import { StorageInterface } from './storageInterface';

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
}

export default Storage;
