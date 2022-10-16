// Generated using pocketbase-typegen

import { Record } from 'pocketbase';

export enum Collections {
	Profiles = 'profiles',
	Tunes = 'tunes',
}

export interface ProfilesRecord extends Record {
	userId: string;
	username: string;
	avatar?: string;
}

export interface TunesRecord extends Record {
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
