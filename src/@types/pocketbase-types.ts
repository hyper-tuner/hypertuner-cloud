// This file was @generated using pocketbase-typegen

export type IsoDateString = string

export type RecordIdString = string

export type UserIdString = string

export type BaseRecord = {
  id: RecordIdString
  created: IsoDateString
  updated: IsoDateString
  collectionId: string
  collectionName: string
  expand?: { [key: string]: any }
}

export enum Collections {
  IniFiles = 'iniFiles',
  Stargazers = 'stargazers',
  Tunes = 'tunes',
  Users = 'users',
}

export type IniFilesRecord = {
  signature: string
  file: string
  ecosystem: 'speeduino' | 'rusefi'
}

export type IniFilesResponse = IniFilesRecord & BaseRecord

export type StargazersRecord = {
  user: RecordIdString
  tune: RecordIdString
}

export type StargazersResponse = StargazersRecord & BaseRecord

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
  aspiration: 'na' | 'turbocharged' | 'supercharged'
  compression?: number
  fuel?: string
  ignition?: string
  injectorsSize?: number
  year?: number
  hp?: number
  stockHp?: number
  readme: string
  tags: 'base map' | 'help needed'
  textSearch: string
  visibility: 'public' | 'unlisted'
  tuneFile: string
  customIniFile?: string
  logFiles?: string[]
  toothLogFiles?: string[]
}

export type TunesResponse = TunesRecord & BaseRecord

export type UsersRecord = {
  avatar?: string
  username: string
  email: string
  verified: boolean
}

export type UsersResponse = UsersRecord & BaseRecord

export type CollectionRecords = {
  iniFiles: IniFilesRecord
  stargazers: StargazersRecord
  tunes: TunesRecord
  users: UsersRecord
}
