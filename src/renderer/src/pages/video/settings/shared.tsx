import { cn, Divider } from '@heroui/react'
import { PropsWithChildren, ReactNode } from 'react'

export const SettingsGroup = ({ children }: PropsWithChildren) => {
  return <div className="rounded-2xl bg-foreground-200">{children}</div>
}

export const SettingItem = ({ children, divider = false }: PropsWithChildren<{ divider?: boolean }>) => {
  return (
    <>
      <div className="mb-2">{children}</div>
      {divider && <Divider className="my-2" />}
    </>
  )
}

export const SettingTitle = ({ name, footer }: { name: string; footer?: ReactNode }) => {
  return (
    <div className={cn('mb-2 flex items-center', footer ? 'justify-between' : 'justify-start')}>
      <span className="font-bold">{name}</span>
      {footer}
    </div>
  )
}
