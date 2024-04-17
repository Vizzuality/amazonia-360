"use client";

import { Children, FC, HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ControlsProps = PropsWithChildren<{
  className?: HTMLAttributes<HTMLDivElement>["className"];
}>;

export const Controls: FC<ControlsProps> = ({
  className = "absolute top-4 right-4",
  children,
}: ControlsProps) => (
  <div
    className={cn({
      "flex flex-col space-y-2": true,
      [className]: !!className,
    })}
  >
    {Children.map(children, (child) => child)}
  </div>
);

export default Controls;
