// Generated using pocketbase-typegen

export enum Collections {
	Profiles = 'profiles',
	Tunes = 'tunes',
}

export type ProfilesRecord = {
	userId: string;
	username: string;
	avatar?: string;
}

// TODO: regenerate this

export type TunesRecord = {
	tuneId: string;
	user: string;
	signature: string;
	vehicleName: string;
	engineMake: string;
	engineCode: string;
	displacement: number;
	cylindersCount: number;
	aspiration: string;
	compression?: number;
	fuel?: string;
	ignition?: string;
	injectorsSize?: number;
	year?: number;
	hp?: number;
	stockHp?: number;
	visibility: string;
	tuneFile: string;
	readme: string;
	textSearch: string;
	customIniFile?: string;
	logFiles?: string;
	toothLogFiles?: string;
}
