import {
  Config,
  Logs,
  TuneWithDetails,
} from '@hyper-tuner/types';
import {
  CompositeLogEntry,
  ToothLogEntry,
} from '../utils/logs/TriggerLogsParser';
import { TunesRecordFull } from './dbData';

export interface ConfigState extends Config {}

export interface TuneState extends TuneWithDetails {}

export interface TuneDataState extends TunesRecordFull {}

export interface LogsState {
  fileName: string;
  logs: Logs;
}

export interface ToothLogsState {
  fileName: string;
  type: 'tooth' | 'composite';
  logs: CompositeLogEntry[] | ToothLogEntry[];
}

export interface UIState {
  sidebarCollapsed: boolean;
}

export interface StatusState {
  text: string | null;
}

export interface NavigationState {
  tuneId: string | null;
}

export interface AppState {
  tune: TuneState;
  tuneData: TuneDataState;
  config: ConfigState;
  logs: LogsState,
  toothLogs: ToothLogsState,
  ui: UIState;
  status: StatusState;
  navigation: NavigationState;
}

export interface UpdateTunePayload {
  name: string;
  value: string | number;
}
