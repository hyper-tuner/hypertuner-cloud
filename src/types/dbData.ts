export interface TuneDataDetails {
  readme?: string | null;
  make?: string | null;
  model?: string | null;
  displacement?: number | null;
  year?: number | null;
  hp?: number | null;
  stockHp?: number | null;
  engineCode?: string | null;
  cylindersCount?: number | null;
  aspiration?: string | null;
  fuel?: string | null;
  injectorsSize?: number | null;
  coils?: string | null;
}

export interface TuneDbData {
  tuneId: string,
  userId: string;
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
  isListed: boolean;
  tuneFileId: string | null;
  logFileIds: string[];
  toothLogFileIds: string[];
  customIniFileId?: string | null;
  readme: string | null;
  make: string | null;
  model: string | null;
  displacement: number | null;
  year: number | null;
  hp?: number | null;
  stockHp?: number | null;
  engineCode?: string | null;
  cylindersCount?: number | null;
  aspiration?: string | null;
  fuel?: string | null;
  injectorsSize?: number | null;
  coils?: string | null;
}
