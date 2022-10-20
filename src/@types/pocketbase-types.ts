// This file was @generated using pocketbase-typegen

export enum Collections {
	IniFiles = 'iniFiles',
	Profiles = 'profiles',
	Tunes = 'tunes',
}

export type IniFilesRecord = {
	signature: string
	file: string
	ecosystem: string
}

export type ProfilesRecord = {
	userId: string
	username: string
	avatar?: string
}

export type TunesRecord = {
	user: string
	userProfile: string
	tuneId: string
	signature: string
	vehicleName: string
	engineMake: string
	engineCode: string
	displacement: number
	cylindersCount: number
	aspiration: string
	compression?: number
	fuel?: string
	ignition?: string
	injectorsSize?: number
	year?: number
	hp?: number
	stockHp?: number
	readme: string
	textSearch: string
	visibility: string
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
