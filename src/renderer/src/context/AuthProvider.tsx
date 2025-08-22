import LoginPage from '@renderer/pages/auth/login'
import { RootState } from '@renderer/store'
import { FC, PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const { isLogin } = useSelector((state: RootState) => state.auth)

  if (!isLogin) {
    return <LoginPage />
  }

  return children
}

export default AuthProvider
