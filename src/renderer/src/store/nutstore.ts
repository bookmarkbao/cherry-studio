import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RemoteSyncState } from './backup'

export interface NutstoreSyncState extends RemoteSyncState {}

export interface NutstoreState {
  nutstoreToken: string | null
  nutstorePath: string
  nutstoreAutoSync: boolean
  nutstoreSyncInterval: number
  nutstoreSyncState: NutstoreSyncState
  nutstoreSkipBackupFile: boolean
  nutstoreMaxBackups: number
  nutstoreSingleFileOverwrite: boolean
  nutstoreSingleFileName: string
}

const initialState: NutstoreState = {
  nutstoreToken: '',
  nutstorePath: '/cherry-studio',
  nutstoreAutoSync: false,
  nutstoreSyncInterval: 0,
  nutstoreSyncState: {
    lastSyncTime: null,
    syncing: false,
    lastSyncError: null
  },
  nutstoreSkipBackupFile: false,
  nutstoreMaxBackups: 0,
  nutstoreSingleFileOverwrite: false,
  nutstoreSingleFileName: ''
}

const nutstoreSlice = createSlice({
  name: 'nutstore',
  initialState,
  reducers: {
    setNutstoreToken: (state, action: PayloadAction<string>) => {
      state.nutstoreToken = action.payload
    },
    setNutstorePath: (state, action: PayloadAction<string>) => {
      state.nutstorePath = action.payload
    },
    setNutstoreAutoSync: (state, action: PayloadAction<boolean>) => {
      state.nutstoreAutoSync = action.payload
    },
    setNutstoreSyncInterval: (state, action: PayloadAction<number>) => {
      state.nutstoreSyncInterval = action.payload
    },
    setNutstoreSyncState: (state, action: PayloadAction<Partial<RemoteSyncState>>) => {
      state.nutstoreSyncState = { ...state.nutstoreSyncState, ...action.payload }
    },
    setNutstoreSkipBackupFile: (state, action: PayloadAction<boolean>) => {
      state.nutstoreSkipBackupFile = action.payload
    },
    setNutstoreMaxBackups: (state, action: PayloadAction<number>) => {
      state.nutstoreMaxBackups = action.payload
    },
    setNutstoreSingleFileOverwrite: (state, action: PayloadAction<boolean>) => {
      state.nutstoreSingleFileOverwrite = action.payload
    },
    setNutstoreSingleFileName: (state, action: PayloadAction<string>) => {
      state.nutstoreSingleFileName = action.payload
    }
  }
})

export const {
  setNutstoreToken,
  setNutstorePath,
  setNutstoreAutoSync,
  setNutstoreSyncInterval,
  setNutstoreSyncState,
  setNutstoreSkipBackupFile,
  setNutstoreMaxBackups,
  setNutstoreSingleFileOverwrite,
  setNutstoreSingleFileName
} = nutstoreSlice.actions

export default nutstoreSlice.reducer
