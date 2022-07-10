import { Timestamp } from 'firebase/firestore/lite';

type Partial<T> = {
  [A in keyof T]?: T[A];
};

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

export interface TuneDbDataLegacy {
  id?: string,
  userUid?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  isPublished?: boolean;
  isListed?: boolean;
  tuneFile?: string | null;
  logFiles?: string[];
  toothLogFiles?: string[];
  customIniFile?: string | null;
  details?: TuneDataDetails;
}

export interface TuneDbData {
  userId: string;
  tuneId: string;
  signature: string;
  isPublished: boolean;
  isListed: boolean;
  tuneFileId: string;
  logFileIds?: string[];
  toothLogFileIds?: string[];
  customIniFileId?: string | null;
  vehicleName: string | null;
  engineMake: string | null;
  engineCode: string | null;
  displacement: number | null;
  cylindersCount: number | null;
  compression?: number | null;
  aspiration: 'na' | 'turbocharged' | 'supercharged';
  fuel?: string | null;
  ignition?: string | null;
  injectorsSize?: number | null;
  year?: number | null;
  hp?: number | null;
  stockHp?: number | null;
  readme: string | null;
}

export type TuneDbDataPartial = Partial<TuneDbData>;

export interface UsersBucket {
  userId: string;
  bucketId: string;
  visibility: 'pubic' | 'private';
  createdAt: number;
}
