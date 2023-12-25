/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

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
  'speeduino' = 'speeduino',
  'rusefi' = 'rusefi',
  'fome' = 'fome',
}
export type IniFilesRecord = {
  ecosystem: IniFilesEcosystemOptions;
  file: string;
  signature: string;
};

export type StargazersRecord = {
  tune: RecordIdString;
  user: RecordIdString;
};

export enum TunesSourceOptions {
  'web' = 'web',
  'app' = 'app',
}

export enum TunesAspirationOptions {
  'na' = 'na',
  'turbocharged' = 'turbocharged',
  'supercharged' = 'supercharged',
}

export enum TunesTagsOptions {
  'base map' = 'base map',
  'help needed' = 'help needed',
}

export enum TunesVisibilityOptions {
  'public' = 'public',
  'unlisted' = 'unlisted',
}
export type TunesRecord = {
  aspiration: TunesAspirationOptions;
  author: RecordIdString;
  compression?: number;
  customIniFile?: string;
  cylindersCount: number;
  displacement: number;
  engineCode: string;
  engineMake: string;
  fuel?: string;
  hp?: number;
  ignition?: string;
  injectorsSize?: number;
  logFiles?: string[];
  readme: string;
  signature: string;
  source: TunesSourceOptions;
  stars?: number;
  stockHp?: number;
  tags?: TunesTagsOptions;
  textSearch: string;
  toothLogFiles?: string[];
  tuneFile: string;
  tuneId: string;
  vehicleName: string;
  visibility: TunesVisibilityOptions;
  year?: number;
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

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
  collection(idOrName: 'iniFiles'): RecordService<IniFilesResponse>;
  collection(idOrName: 'stargazers'): RecordService<StargazersResponse>;
  collection(idOrName: 'tunes'): RecordService<TunesResponse>;
  collection(idOrName: 'users'): RecordService<UsersResponse>;
};
