import { cn } from "@/lib/utils";

export function AuthSidePanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("absolute top-0 right-0 hidden h-full w-5/12 lg:block print:hidden", className)}
      {...props}
    />
  );
}
