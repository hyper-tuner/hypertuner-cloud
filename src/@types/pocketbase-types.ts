/**
 * This file was @generated using pocketbase-typegen
 */

export enum Collections {
  IniFiles = 'iniFiles',
  Stargazers = 'stargazers',
  Tunes = 'tunes',
  Users = 'users',
}

// Alias types for improved usability
export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

// System fields
export type BaseSystemFields<T = never> = {
  id: RecordIdString;
  created: IsoDateString;
  updated: IsoDateString;
  collectionId: string;
  collectionName: Collections;
  expand?: T;
};

export type AuthSystemFields<T = never> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export enum IniFilesEcosystemOptions {
  speeduino = 'speeduino',
  rusefi = 'rusefi',
  fome = 'fome',
}
export type IniFilesRecord = {
  signature: string;
  file: string;
  ecosystem: IniFilesEcosystemOptions;
};

export type StargazersRecord = {
  user: RecordIdString;
  tune: RecordIdString;
};

export enum TunesSourceOptions {
  web = 'web',
  app = 'app',
}

export enum TunesAspirationOptions {
  na = 'na',
  turbocharged = 'turbocharged',
  supercharged = 'supercharged',
}

export enum TunesTagsOptions {
  'base map' = 'base map',
  'help needed' = 'help needed',
}

export enum TunesVisibilityOptions {
  public = 'public',
  unlisted = 'unlisted',
}
export type TunesRecord = {
  author: RecordIdString;
  tuneId: string;
  source: TunesSourceOptions;
  signature: string;
  stars?: number;
  vehicleName: string;
  engineMake: string;
  engineCode: string;
  displacement: number;
  cylindersCount: number;
  aspiration: TunesAspirationOptions;
  compression?: number;
  fuel?: string;
  ignition?: string;
  injectorsSize?: number;
  year?: number;
  hp?: number;
  stockHp?: number;
  readme: string;
  tags?: TunesTagsOptions;
  textSearch: string;
  visibility: TunesVisibilityOptions;
  tuneFile: string;
  customIniFile?: string;
  logFiles?: string[];
  toothLogFiles?: string[];
};

export type UsersRecord = {
  avatar?: string;
  verifiedAuthor?: boolean;
};

// Response types include system fields and match responses from the PocketBase API
export type IniFilesResponse<Texpand = unknown> = Required<IniFilesRecord> &
  BaseSystemFields<Texpand>;
export type StargazersResponse<Texpand = unknown> = Required<StargazersRecord> &
  BaseSystemFields<Texpand>;
export type TunesResponse<Texpand = unknown> = Required<TunesRecord> & BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
  iniFiles: IniFilesRecord;
  stargazers: StargazersRecord;
  tunes: TunesRecord;
  users: UsersRecord;
};

export type CollectionResponses = {
  iniFiles: IniFilesResponse;
  stargazers: StargazersResponse;
  tunes: TunesResponse;
  users: UsersResponse;
};
