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

export type TunesRecord = {
	user: string;
	userProfile: string;
	tuneId: string;
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
	readme: string;
	textSearch: string;
	visibility: string;
	tuneFile: string;
	customIniFile?: string;
	logFiles?: string[];
	toothLogFiles?: string[];
}
