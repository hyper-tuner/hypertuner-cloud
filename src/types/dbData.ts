export interface TuneDataDetails {
  readme?: string | null;
  make?: string | null;
  model?: string | null;
  displacement?: string | null;
  year?: number | null;
  hp?: number | null;
  stockHp?: number | null;
  engineCode?: string | null;
  cylinders?: number | null;
  aspiration?: string | null;
  fuel?: string | null;
  injectors?: string | null;
  coils?: string | null;
}

export interface TuneDbData {
  userUid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPublished?: boolean;
  isListed?: boolean;
  isPublic?: boolean;
  tuneFile?: string | null;
  logFiles?: string[];
  toothLogFiles?: string[];
  customIniFile?: string | null;
  details?: TuneDataDetails;
}
