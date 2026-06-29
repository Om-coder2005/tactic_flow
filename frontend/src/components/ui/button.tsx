import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-retro-ink text-white shadow-material-1 hover:bg-retro-ink/90 hover:shadow-material-2",
        destructive: "bg-retro-burgundy text-white shadow-material-1 hover:bg-retro-burgundy/90 hover:shadow-material-2",
        outline: "border-2 border-surface-200 bg-transparent hover:bg-surface-100 hover:border-surface-300 text-surface-700",
        secondary: "bg-retro-mustard text-retro-ink shadow-material-1 hover:bg-retro-mustard/90 hover:shadow-material-2",
        ghost: "hover:bg-surface-100 text-surface-600 hover:text-surface-900",
        link: "text-accent underline-offset-4 hover:underline",
        retro: "bg-retro-cream border-2 border-retro-ink shadow-retro text-retro-ink hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 rounded-lg",
        lg: "h-14 px-10 rounded-2xl text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
