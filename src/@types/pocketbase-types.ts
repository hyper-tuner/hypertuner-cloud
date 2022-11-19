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
export type IsoDateString = string
export type RecordIdString = string

// System fields
export type BaseSystemFields = {
  id: RecordIdString
  created: IsoDateString
  updated: IsoDateString
  collectionId: string
  collectionName: Collections
  expand?: { [key: string]: any }
}

export type AuthSystemFields = {
  email: string
  emailVisibility: boolean
  username: string
  verified: boolean
} & BaseSystemFields

// Record types for each collection

export enum IniFilesEcosystemOptions {
  speeduino = 'speeduino',
  rusefi = 'rusefi',
}

export type IniFilesRecord = {
  signature: string
  file: string
  ecosystem: IniFilesEcosystemOptions
}

export type StargazersRecord = {
  user: RecordIdString
  tune: RecordIdString
}

export enum TunesAspirationOptions {
  na = 'na',
  turbocharged = 'turbocharged',
  supercharged = 'supercharged',
}

export enum TunesTagsOptions {
  BaseMap = 'base map',
  HelpNeeded = 'help needed',
}

export enum TunesVisibilityOptions {
  public = 'public',
  unlisted = 'unlisted',
}

export type TunesRecord = {
  author: RecordIdString
  tuneId: string
  signature: string
  stars?: number
  vehicleName: string
  engineMake: string
  engineCode: string
  displacement: number
  cylindersCount: number
  aspiration: TunesAspirationOptions
  compression?: number
  fuel?: string
  ignition?: string
  injectorsSize?: number
  year?: number
  hp?: number
  stockHp?: number
  readme: string
  tags?: TunesTagsOptions
  textSearch: string
  visibility: TunesVisibilityOptions
  tuneFile: string
  customIniFile?: string
  logFiles?: string[]
  toothLogFiles?: string[]
}

export type UsersRecord = {
  avatar?: string
  verifiedAuthor?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type IniFilesResponse = IniFilesRecord & BaseSystemFields
export type StargazersResponse = StargazersRecord & BaseSystemFields
export type TunesResponse = TunesRecord & BaseSystemFields
export type UsersResponse = UsersRecord & AuthSystemFields

export type CollectionRecords = {
  iniFiles: IniFilesRecord
  stargazers: StargazersRecord
  tunes: TunesRecord
  users: UsersRecord
}
