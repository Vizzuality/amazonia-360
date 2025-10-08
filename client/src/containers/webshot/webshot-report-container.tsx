import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const WebshotReportContainer = ({
  children,
  cover,
  index,
}: {
  children: ReactNode;
  index?: number;
  cover?: boolean;
}) => {
  return (
    <div
      className={cn({
        "relative flex h-[237mm] w-full flex-col overflow-hidden bg-blue-50 pt-16": true,
        "pt-0": cover,
        "break-before-page": index !== 0,
      })}
    >
      {children}
    </div>
  );
};
