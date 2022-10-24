// This file was @generated using pocketbase-typegen

export type IsoDateString = string

export type RecordIdString = string

export type UserIdString = string

export type BaseRecord = {
    id: RecordIdString
    created: IsoDateString
    updated: IsoDateString
    '@collectionId': string
    '@collectionName': string
}

export enum Collections {
	IniFiles = 'iniFiles',
	Profiles = 'profiles',
	Tunes = 'tunes',
}

export type IniFilesRecord = {
	signature: string
	file: string
	ecosystem: 'speeduino' | 'rusefi'
}

export type ProfilesRecord = {
	userId: UserIdString
	username: string
	avatar?: string
}

export type TunesRecord = {
	user: UserIdString
	userProfile: RecordIdString
	tuneId: string
	signature: string
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
	textSearch: string
	visibility: 'public' | 'unlisted'
	tuneFile: string
	customIniFile?: string
	logFiles?: string[]
	toothLogFiles?: string[]
}

export type CollectionRecords = {
	iniFiles: IniFilesRecord
	profiles: ProfilesRecord
	tunes: TunesRecord
}
