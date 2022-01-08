export interface StorageInterface {
  get(key: string): Promise<string | null>;
  getSync(key: string): string | null;
  set(key: string, value: string): Promise<void>;
  delete(key: string): void;
  isAvailable(): Promise<boolean>;
}
