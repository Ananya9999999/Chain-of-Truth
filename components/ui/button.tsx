import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-xs font-semibold whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95',
        outline:
          'border-border/80 bg-secondary/40 text-foreground hover:bg-secondary hover:border-border active:bg-secondary/70 shadow-xs',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50 shadow-xs',
        ghost:
          'text-muted-foreground hover:bg-secondary/60 hover:text-foreground active:bg-secondary/80',
        destructive:
          'bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger/95 shadow-xs border border-danger/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8.5 gap-2 px-3',
        xs: 'h-6 gap-1 rounded-md px-2 text-[11px] [&_svg:not([class*=\'size-\'])]:size-3',
        sm: 'h-7.5 gap-1.5 rounded-md px-2.5 text-xs [&_svg:not([class*=\'size-\'])]:size-3',
        lg: 'h-9.5 gap-2 px-4 text-sm',
        icon: 'size-8.5',
        'icon-xs': 'size-6 rounded-md [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-sm': 'size-7.5 rounded-md',
        'icon-lg': 'size-9.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

