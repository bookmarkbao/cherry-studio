import { LinkOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { loggerService } from '@logger'
import WindowControls from '@renderer/components/WindowControls'
import api, { updateApiBasePath, updateApiToken } from '@renderer/config/api'
import { APP_NAME, AppLogo } from '@renderer/config/env'
import { useAuth } from '@renderer/hooks/useAuth'
import { syncConfig } from '@renderer/services/sync/sync'
import { useAppDispatch } from '@renderer/store'
import {
  setAccessToken,
  setIsLogin,
  setLastLoginMethod,
  setServerUrl,
  setUser,
  setUsername
} from '@renderer/store/auth'
import { setUserName } from '@renderer/store/settings'
import { isAdmin } from '@renderer/utils/auth'
import { IpcChannel } from '@shared/IpcChannel'
import { Button, Card, Form, Input, notification as Notification } from 'antd'
import { AxiosError } from 'axios'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const logger = loggerService.withContext('LoginPage')

interface LoginFormValues {
  username: string
  password: string
  serverUrl: string
}

const BACKGROUND_IMAGE = 'https://api.dujin.org/bing/1920.php'

const LoginPage: FC = () => {
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [currentServerUrl, setCurrentServerUrl] = useState('')
  const dispatch = useAppDispatch()
  const { serverUrl, username, lastLoginMethod } = useAuth()
  const [loginMode, setLoginMode] = useState<'sso' | 'password'>(lastLoginMethod || 'sso') // 使用上次成功的登录方式
  const [notification, contextHolder] = Notification.useNotification()
  const [form] = Form.useForm()
  const { t } = useTranslation()

  // 验证URL是否合法
  const isValidUrl = (url: string): boolean => {
    try {
      if (!url?.trim()) return false
      const urlObj = new URL(url.trim())
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch (error) {
      return false
    }
  }

  // 获取当前表单中的服务器URL
  const getCurrentServerUrl = (): string => {
    return form.getFieldValue('serverUrl') || ''
  }

  // 检查SSO按钮是否应该禁用
  const isSSOButtonDisabled = (): boolean => {
    return !isValidUrl(currentServerUrl)
  }

  // 监听表单值变化
  useEffect(() => {
    const serverUrlValue = getCurrentServerUrl()
    setCurrentServerUrl(serverUrlValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getFieldValue('serverUrl')])

  // 监听表单字段变化
  const handleFormValuesChange = (changedValues: any) => {
    if (changedValues.serverUrl !== undefined) {
      setCurrentServerUrl(changedValues.serverUrl || '')
    }
  }

  // 切换登录模式
  const switchToPasswordMode = () => {
    setLoginMode('password')
    // 切换到密码模式时，设置表单初始值
    form.setFieldsValue({
      serverUrl: serverUrl || currentServerUrl,
      username: username || '',
      password: ''
    })
  }

  const switchToSSOMode = () => {
    setSsoLoading(false)
    setLoginMode('sso')
    // 切换到SSO模式时，只保留服务器地址
    form.setFieldsValue({
      serverUrl: serverUrl || currentServerUrl
    })
  }

  // 清理SSO回调处理器
  useEffect(() => {
    const cleanup = window.electron.ipcRenderer.on(IpcChannel.OAuth_Casdoor, async (_, data) => {
      logger.debug('OAuth_Casdoor', data)

      if (data?.token && data?.user) {
        const { user, token } = data

        if (isAdmin(user)) {
          notification.error({ message: t('enterprise.login.admin_forbidden'), duration: 5 })
          setSsoLoading(false)
          return
        }

        updateApiToken(token)

        dispatch(setUser(user))
        dispatch(setUsername(user.username))
        dispatch(setAccessToken(token))
        dispatch(setUserName(user.username))
        dispatch(setLastLoginMethod('sso')) // 记录SSO登录成功

        // 同步配置
        try {
          await syncConfig()
          dispatch(setIsLogin(true))
        } catch (error: any) {
          logger.error('[SSO Login] syncConfig error', error)
          notification.error({
            message: t('enterprise.login.error.sync_config_failed'),
            description: getMessage(error, t),
            duration: 5
          })
          setSsoLoading(false)
        }

        setSsoLoading(false)
      } else {
        // 如果没有收到有效数据，也要重置loading状态
        setSsoLoading(false)
      }
    })

    return () => {
      cleanup()
      // 组件卸载时重置loading状态
      setSsoLoading(false)
    }
  }, [dispatch, notification, t])

  // 组件卸载时清理loading状态
  useEffect(() => {
    return () => {
      setSsoLoading(false)
    }
  }, [])

  const validateUrl = (_: any, value: string) => {
    try {
      if (!value) {
        return Promise.reject(t('enterprise.login.validation.server_url_empty'))
      }
      const url = new URL(value.trim())
      if (!['http:', 'https:'].includes(url.protocol)) {
        return Promise.reject(t('enterprise.login.validation.server_url_invalid_protocol'))
      }
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(t('enterprise.login.validation.server_url_invalid_format'))
    }
  }

  const handleSSOLogin = async () => {
    // 如果已经在loading状态，不允许重复点击
    if (ssoLoading) {
      return
    }

    try {
      // 使用当前状态中的服务器URL
      const serverUrlValue = currentServerUrl

      if (!serverUrlValue?.trim()) {
        notification.error({ message: t('enterprise.login.validation.server_url_required'), duration: 5 })
        return
      }

      if (!isValidUrl(serverUrlValue)) {
        notification.error({ message: t('enterprise.login.validation.server_url_invalid'), duration: 5 })
        return
      }

      const serverUrl = serverUrlValue.trim().replace(/\/+$/, '')
      const ssoUrl = `${serverUrl}/auth/casdoor?client=desktop`

      // 设置服务端地址
      dispatch(setServerUrl(serverUrl))

      // 使用默认浏览器打开SSO登录页面
      window.api.openWebsite(ssoUrl)

      setSsoLoading(true)

      // 设置超时
      setTimeout(() => {
        setSsoLoading((prevLoading) => {
          if (prevLoading) {
            notification.error({ message: t('enterprise.login.error.sso_timeout'), duration: 5 })
            return false
          }
          return prevLoading
        })
      }, 300000) // 5分钟超时
    } catch (error: any) {
      logger.error('[SSO Login] error', error)
      notification.error({
        message: t('enterprise.login.error.sso_failed'),
        description: getMessage(error, t),
        duration: 5
      })
      setSsoLoading(false)
    }
  }

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true)

    try {
      const serverUrl = values.serverUrl.trim().replace(/\/+$/, '')

      // 设置服务端地址
      dispatch(setServerUrl(serverUrl))

      // 设置 API 基路径
      updateApiBasePath(serverUrl)

      const { data } = await api.authLogin({
        authLoginRequest: {
          username: values.username,
          password: values.password
        }
      })

      const { user, access_token } = data

      if (isAdmin(user)) {
        notification.error({ message: t('enterprise.login.admin_forbidden'), duration: 5 })
        return
      }

      updateApiToken(access_token)

      if (user && access_token) {
        dispatch(setUser(user))
        dispatch(setUsername(user.username))
        dispatch(setAccessToken(access_token))
        dispatch(setUserName(user.username))
        dispatch(setLastLoginMethod('password')) // 记录密码登录成功
        access_token && updateApiToken(access_token)
        serverUrl && updateApiBasePath(serverUrl)
      }

      try {
        await syncConfig()
      } catch (error) {
        logger.error('syncConfig error', error as Error)
        notification.error({
          message: t('enterprise.login.error.sync_config_failed'),
          description: getMessage(error, t),
          duration: 5
        })
        return
      }

      dispatch(setIsLogin(true))
    } catch (error) {
      logger.error('Login Error', error as Error)
      notification.error({
        message: t('enterprise.login.error.login_failed'),
        description: getMessage(error, t),
        duration: 5
      })
    } finally {
      setLoading(false)
    }
  }

  // 渲染SSO登录界面
  const renderSSOLogin = () => (
    <>
      <Form
        form={form}
        name="sso-login"
        initialValues={{ serverUrl }}
        size="large"
        onValuesChange={handleFormValuesChange}>
        <Form.Item name="serverUrl" rules={[{ validator: validateUrl }]}>
          <Input prefix={<LinkOutlined />} placeholder={t('enterprise.login.placeholder.server_url')} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 16 }}>
          <SSOButton
            type="primary"
            block
            loading={ssoLoading}
            onClick={handleSSOLogin}
            disabled={isSSOButtonDisabled()}>
            {t('enterprise.login.button.sso_login')}
          </SSOButton>
        </Form.Item>
      </Form>
      <SwitchLink onClick={switchToPasswordMode}>{t('enterprise.login.switch.password_mode')}</SwitchLink>
    </>
  )

  // 渲染用户名密码登录界面
  const renderPasswordLogin = () => (
    <>
      <Form
        form={form}
        name="password-login"
        initialValues={{ remember: true, serverUrl, username }}
        onFinish={onFinish}
        size="large"
        onValuesChange={handleFormValuesChange}>
        <Form.Item name="serverUrl" rules={[{ validator: validateUrl }]}>
          <Input prefix={<LinkOutlined />} placeholder={t('enterprise.login.placeholder.server_url')} />
        </Form.Item>

        <Form.Item
          name="username"
          rules={[
            { required: true, message: t('enterprise.login.validation.username_required') },
            { pattern: /^\S+$/, message: t('enterprise.login.validation.username_no_spaces') }
          ]}>
          <Input prefix={<UserOutlined />} placeholder={t('enterprise.login.placeholder.username')} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('enterprise.login.validation.password_required') },
            { pattern: /^\S+$/, message: t('enterprise.login.validation.password_no_spaces') }
          ]}>
          <Input.Password prefix={<LockOutlined />} placeholder={t('enterprise.login.placeholder.password')} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <LoginButton type="primary" htmlType="submit" block loading={loading}>
            {t('enterprise.login.button.login')}
          </LoginButton>
        </Form.Item>
      </Form>
      <SwitchLink onClick={switchToSSOMode}>{t('enterprise.login.switch.sso_mode')}</SwitchLink>
    </>
  )

  return (
    <Container>
      <TitleBar>
        <WindowControls />
      </TitleBar>
      {contextHolder}
      <LoginCard>
        <LogoContainer>
          <img src={AppLogo} alt="App Logo" />
          <BrandTitle>{APP_NAME}</BrandTitle>
        </LogoContainer>

        {loginMode === 'sso' ? renderSSOLogin() : renderPasswordLogin()}
      </LoginCard>
    </Container>
  )
}

const getMessage = (error: any, t: any) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return t('enterprise.login.error.invalid_credentials')
    }
    return error.response?.data.message
  }
  return error.message
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background:
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    url(${BACKGROUND_IMAGE}) center/cover no-repeat;
  -webkit-app-region: no-drag;
  position: relative;
`

const TitleBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: transparent;
  -webkit-app-region: drag;
  z-index: 1000;
`

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-radius: 25px;
  padding: 15px 24px;
  -webkit-app-region: no-drag;
  backdrop-filter: blur(10px);
  background: var(--color-background-opacity);
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  img {
    height: 80px;
    width: auto;
    border-radius: 50%;
    margin-bottom: 12px;
  }
`

const BrandTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  padding: 0;
`

const LoginButton = styled(Button)`
  height: 40px;
`

const SSOButton = styled(Button)`
  height: 40px;
`

const SwitchLink = styled.div`
  text-align: center;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    color: #40a9ff;
    text-decoration: underline;
  }
`

export default LoginPage
