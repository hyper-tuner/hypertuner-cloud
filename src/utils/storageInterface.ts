export interface StorageInterface {
  get(key: string): Promise<string | null>;
  getSync(key: string): string | null;
  set(key: string, value: string): Promise<void>;
  isAvailable(): Promise<boolean>;
}
