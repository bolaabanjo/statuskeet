import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        outline:
          "relative border-border bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_5px)] hover:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(0,0,0,0.1)_4px,rgba(0,0,0,0.1)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.03)_4px,rgba(255,255,255,0.03)_5px)] dark:hover:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.06)_4px,rgba(255,255,255,0.06)_5px)] text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-none",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {variant === "outline" && (
        <>
          <span className="pointer-events-none absolute -top-[4px] -left-[4px] flex h-[8px] w-[8px]">
            <span className="absolute left-[3px] top-0 h-[8px] w-[1px] bg-foreground/40" />
            <span className="absolute top-[3px] left-0 h-[1px] w-[8px] bg-foreground/40" />
          </span>
          <span className="pointer-events-none absolute -top-[4px] -right-[4px] flex h-[8px] w-[8px]">
            <span className="absolute right-[3px] top-0 h-[8px] w-[1px] bg-foreground/40" />
            <span className="absolute top-[3px] right-0 h-[1px] w-[8px] bg-foreground/40" />
          </span>
          <span className="pointer-events-none absolute -bottom-[4px] -left-[4px] flex h-[8px] w-[8px]">
            <span className="absolute left-[3px] bottom-0 h-[8px] w-[1px] bg-foreground/40" />
            <span className="absolute bottom-[3px] left-0 h-[1px] w-[8px] bg-foreground/40" />
          </span>
          <span className="pointer-events-none absolute -bottom-[4px] -right-[4px] flex h-[8px] w-[8px]">
            <span className="absolute right-[3px] bottom-0 h-[8px] w-[1px] bg-foreground/40" />
            <span className="absolute bottom-[3px] right-0 h-[1px] w-[8px] bg-foreground/40" />
          </span>
        </>
      )}
      {props.children}
    </button>
  )
}

export { Button, buttonVariants }
