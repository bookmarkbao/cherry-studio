import { cn } from '@cherrystudio/ui/utils'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { LoaderIcon } from 'lucide-react'
import * as React from 'react'

// Enhanced Switch component with loading state support
interface CustomSwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  /** When true, displays a loading spinner in the switch thumb. Defaults to false when undefined. */
  loading?: boolean
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

const DescriptionSwitch = ({ children, ...props }: CustomSwitchProps) => {
  return (
    <div className="flex w-full justify-between">
      {children}
      <CustomizedSwitch
        // classNames={{
        //   base: cn(
        //     'inline-flex w-full max-w-md flex-row-reverse items-center hover:bg-content2',
        //     'cursor-pointer justify-between gap-2 rounded-lg border-2 border-transparent py-2 pr-1',
        //     'data-[selected=true]:border-primary'
        //   ),
        //   wrapper: 'p-0 h-4 overflow-visible',
        //   thumb: cn(
        //     'h-6 w-6 border-2 shadow-lg',
        //     'group-data-[hover=true]:border-primary',
        //     //selected
        //     'group-data-[selected=true]:ms-6',
        //     // pressed
        //     'group-data-[pressed=true]:w-7',
        //     'group-data-pressed:group-data-selected:ms-4'
        //   )
        // }}

        {...props}></CustomizedSwitch>
    </div>
  )
}

CustomizedSwitch.displayName = 'Switch'

export { DescriptionSwitch, CustomizedSwitch as Switch }
export type { CustomSwitchProps as SwitchProps }
