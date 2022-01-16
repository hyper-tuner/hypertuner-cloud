import {
  Config,
  Logs,
  Tune,
} from '@speedy-tuner/types';
import { TuneDbData } from './dbData';

export interface ConfigState extends Config {}

export interface TuneState extends Tune {}

export interface TuneDataState extends TuneDbData {}

export interface LogsState extends Logs {}

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
  ui: UIState;
  status: StatusState;
  navigation: NavigationState;
}

export interface UpdateTunePayload {
  name: string;
  value: string | number;
}
