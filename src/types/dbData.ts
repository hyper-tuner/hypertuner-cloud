import { Timestamp } from 'firebase/firestore';

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
  userUid?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  isPublished?: boolean;
  isListed?: boolean;
  isPublic?: boolean;
  tuneFile?: string | null;
  logFiles?: string[];
  toothLogFiles?: string[];
  customIniFile?: string | null;
  details?: TuneDataDetails;
}
