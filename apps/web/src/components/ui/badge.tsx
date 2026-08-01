import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3! [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white",
        brand: "bg-brand-100 text-brand-700",
        neutral: "bg-surface-2 text-text-500",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-success-100 text-success-700",
        warning: "bg-warning-100 text-warning-700",
        destructive: "bg-danger-100 text-danger-700",
        info: "bg-info-100 text-info-700",
        male: "bg-cat-male-100 text-cat-male-600",
        female: "bg-cat-female-100 text-cat-female-600",
        outline: "bg-surface border-border-strong text-text-500",
        ghost: "hover:bg-surface-2 hover:text-text-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
