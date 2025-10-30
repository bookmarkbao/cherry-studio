import { cn } from '@cherrystudio/ui/utils'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { LoaderIcon } from 'lucide-react'
import * as React from 'react'

// Enhanced Switch component with loading state support
interface CustomSwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  /** When true, displays a loading spinner in the switch thumb. Defaults to false when undefined. */
  loading?: boolean
  children?: never
}

function CustomizedSwitch({ loading = false, disabled = false, className, ...props }: CustomSwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      // TODO: use semantic color
      className={cn(
        'group cursor-pointer peer inline-flex h-5.5 w-11 shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
        disabled && '',
        className
      )}
      disabled={disabled}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%+2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground',
          // TODO: use semantic color
          disabled && 'bg-primary backdrop-grayscale-50'
        )}>
        <div className="w-full h-full flex items-center justify-center">
          {loading && <LoaderIcon size={15} className="animate-spin opacity-80" />}
          {!loading && (
            <div
              // TODO: use semantic color
              className={
                'w-0.5 h-1.5 rounded-2xl group-data-[state=checked]:bg-primary group-data-[state=unchecked]:bg-input/80'
              }></div>
          )}
        </div>
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

// /**
//  * A customized Switch component based on HeroUI Switch
//  * @see https://www.heroui.com/docs/components/switch#api
//  * @param isLoading When true, displays a loading spinner in the switch thumb
//  */
// const CustomizedSwitch = ({ isLoading, children, ref, thumbIcon, ...props }: CustomSwitchProps) => {
//   const finalThumbIcon = isLoading ? <Spinner size="sm" /> : thumbIcon

//   return (
//     <Switch ref={ref} {...props} thumbIcon={finalThumbIcon}>
//       {children}
//     </Switch>
//   )
// }

interface DescriptionSwitchProps extends CustomSwitchProps {
  /** Text label displayed next to the switch. */
  label: string
  /** Optional helper text shown below the label. */
  description?: string
  /** Switch position relative to label. Defaults to 'right'. */
  position?: 'left' | 'right'
}

const DescriptionSwitch = ({ label, description, position = 'right', ...props }: DescriptionSwitchProps) => {
  const isLeftSide = position === 'left'
  return (
    // TODO: spacing 3xs
    <div className={cn('flex w-full gap-3', isLeftSide && 'flex-row-reverse')}>
      {/* TODO: spacing 5xs */}
      <div className="flex-1 flex flex-col gap-1">
        {/* TODO: use typography component */}
        <span className="">{label}</span>
        {/* TODO: use typography component */}
        {description && <span className="text-secondary-foreground">{description}</span>}
      </div>
      {/* TODO: padding-top spacing 5xs */}
      <div className="pt-1 flex-col flex justify-start">
        <CustomizedSwitch {...props} />
      </div>
    </div>
  )
}

CustomizedSwitch.displayName = 'Switch'

export { DescriptionSwitch, CustomizedSwitch as Switch }
export type { CustomSwitchProps as SwitchProps }
