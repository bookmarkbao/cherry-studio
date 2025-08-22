import { User } from '@cherrystudio/api-sdk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  isLogin: boolean
  user?: User
  username?: string
  accessToken?: string
  serverUrl?: string
  syncInterval: number
  lastLoginMethod?: 'sso' | 'password'
}

const initialState: AuthState = {
  isLogin: false,
  user: undefined,
  username: undefined,
  accessToken: undefined,
  serverUrl: undefined,
  syncInterval: 60 * 10,
  lastLoginMethod: 'sso'
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setIsLogin: (state, action: PayloadAction<boolean>) => {
      state.isLogin = action.payload
    },
    setUser: (state, action: PayloadAction<User | undefined>) => {
      state.user = action.payload
    },
    setUsername: (state, action: PayloadAction<string | undefined>) => {
      state.username = action.payload
    },
    setAccessToken: (state, action: PayloadAction<string | undefined>) => {
      state.accessToken = action.payload
    },
    setServerUrl: (state, action: PayloadAction<string | undefined>) => {
      state.serverUrl = action.payload
    },
    setSyncInterval: (state, action: PayloadAction<number>) => {
      state.syncInterval = action.payload
    },
    setLastLoginMethod: (state, action: PayloadAction<'sso' | 'password'>) => {
      state.lastLoginMethod = action.payload
    }
  }
})

export const { setIsLogin, setUser, setUsername, setAccessToken, setServerUrl, setSyncInterval, setLastLoginMethod } =
  authSlice.actions

export default authSlice.reducer
