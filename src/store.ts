import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import {
  AppState,
  ConfigState,
  LogsState,
  ToothLogsState,
  TuneDataState,
  TuneState,
  UpdateTunePayload,
} from './types/state';

// tune and config
const updateTune = createAction<UpdateTunePayload>('tune/update');
const loadTune = createAction<TuneState>('tune/load');
const loadTuneData = createAction<TuneDataState>('tuneData/load');
const loadConfig = createAction<ConfigState>('config/load');

// navigation
const setTuneId = createAction<string>('navigation/tuneId');

// logs
const loadLogs = createAction<LogsState>('logs/load');
const loadToothLogs = createAction<ToothLogsState>('toothLogs/load');

// ui
const setSidebarCollapsed = createAction<boolean>('ui/sidebarCollapsed');
const toggleSidebar = createAction('ui/toggleSidebar');

const initialState: AppState = {
  tune: {
    constants: {},
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    details: {} as any,
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  tuneData: {} as any,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  logs: {} as any,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  toothLogs: {} as any,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  config: {} as any,
  ui: {
    sidebarCollapsed: false,
  },
  status: {
    text: null,
  },
  navigation: {
    tuneId: null,
  },
};

const rootReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(loadConfig, (state: AppState, action) => {
      state.config = action.payload;
    })
    .addCase(loadTune, (state: AppState, action) => {
      state.tune = action.payload;
    })
    .addCase(loadTuneData, (state: AppState, action) => {
      state.tuneData = action.payload;
    })
    .addCase(loadLogs, (state: AppState, action) => {
      state.logs = action.payload;
    })
    .addCase(loadToothLogs, (state: AppState, action) => {
      state.toothLogs = action.payload;
    })
    .addCase(updateTune, (state: AppState, action) => {
      state.tune.constants[action.payload.name].value = action.payload.value;
    })
    .addCase(setSidebarCollapsed, (state: AppState, action) => {
      state.ui.sidebarCollapsed = action.payload;
    })
    .addCase(toggleSidebar, (state: AppState) => {
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    })
    .addCase(setTuneId, (state: AppState, action) => {
      state.navigation.tuneId = action.payload;
    });
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
