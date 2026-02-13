import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-blue-100",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        warning: "border-transparent bg-amber-100 text-foreground hover:bg-amber-200",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  onClick?: () => void;
}

function Badge({ className, variant, children, onClick, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
      {!!onClick && (
        <LuX className="ml-1 h-2.5 w-2.5 shrink-0 cursor-pointer text-blue-300" onClick={onClick} />
      )}
    </div>
  );
}

export { Badge, badgeVariants };
