import { Record } from 'pocketbase';
import {
  IniFilesRecord,
  ProfilesRecord,
  TunesRecord,
} from '../@types/pocketbase-types';

type Partial<T> = {
  [A in keyof T]?: T[A];
};

export type TunesRecordPartial = Partial<TunesRecord>;

export interface TunesRecordFull extends TunesRecord, Record { }

export interface ProfilesRecordFull extends ProfilesRecord, Record { }

export interface IniFilesRecordFull extends IniFilesRecord, Record { }
