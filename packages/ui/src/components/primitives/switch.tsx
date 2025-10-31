import { cn } from '@cherrystudio/ui/utils'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { LoaderIcon } from 'lucide-react'
import * as React from 'react'
import { useId } from 'react'

// Enhanced Switch component with loading state support
interface CustomSwitchProps extends Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, 'children'> {
  /** When true, displays a loading spinner in the switch thumb. Defaults to false when undefined. */
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function CustomizedSwitch({ loading = false, disabled = false, size = 'md', className, ...props }: CustomSwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      // TODO: use semantic color
      className={cn(
        'group relative cursor-pointer peer inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
        {
          'w-9 h-5': size === 'sm',
          'w-11 h-5.5': size === 'md',
          'w-11 h-6': size === 'lg'
        },
        // TODO: add disabled style
        disabled && '',
        className
      )}
      disabled={disabled}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-background ring-0 transition-transform data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground',
          // TODO: not final
          {
            'size-3.5 data-[state=checked]:translate-x-9)]': size === 'sm',
            'size-4 ml-[3px] data-[state=checked]:translate-x-5.5': size === 'md',
            'size-[17px] data-[state=checked]:translate-x-11': size === 'lg'
          },
          // TODO: use semantic color
          disabled && 'bg-primary backdrop-grayscale-50'
        )}>
        <div className="w-full h-full flex items-center justify-center">
          {loading && <LoaderIcon size={15} className="animate-spin opacity-80" />}
          {!loading && (
            <div
              // TODO: use semantic color
              className={
                'w-0.5 h-1.5 rounded-2xl transition-colors group-data-[state=checked]:bg-primary group-data-[state=unchecked]:bg-input/80'
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

// TODO: It's not finished. We need to use Typography components instead of native html element.
const DescriptionSwitch = ({ label, description, position = 'right', ...props }: DescriptionSwitchProps) => {
  const isLeftSide = position === 'left'
  const id = useId()
  return (
    // TODO: spacing 3xs
    <div className={cn('flex w-full gap-3 justify-between', isLeftSide && 'flex-row-reverse')}>
      {/* TODO: spacing 5xs */}
      <label
        className={cn('flex flex-col gap-5xs cursor-pointer', {
          'h-7': description === undefined,
          'h-18': description !== undefined
        })}
        htmlFor={id}>
        {/* TODO: use standard typography component */}
        <p className="leading-7">{label}</p>
        {/* TODO: use standard typography component */}
        {description && <span className="text-secondary-foreground">{description}</span>}
      </label>
      <div className="pt-5xs h-7 flex-col flex justify-start">
        <CustomizedSwitch id={id} {...props} />
      </div>
    </div>
  )
}

CustomizedSwitch.displayName = 'Switch'

export { DescriptionSwitch, CustomizedSwitch as Switch }
export type { CustomSwitchProps as SwitchProps }
