import NavigationService from '@renderer/services/NavigationService'
import store, { useAppSelector } from '@renderer/store'
import { setAccessToken, setIsLogin, setUser } from '@renderer/store/auth'
import { resetTabs } from '@renderer/store/tabs'

export const useAuth = () => {
  const { user, username, accessToken, serverUrl, isLogin, lastLoginMethod } = useAppSelector((state) => state.auth)

  return { user, username, accessToken, serverUrl, isLogin, lastLoginMethod }
}

export const logout = () => {
  NavigationService.navigate?.('/')
  store.dispatch(setUser(undefined))
  store.dispatch(setAccessToken(undefined))
  store.dispatch(setIsLogin(false))
  store.dispatch(resetTabs())
}
