import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const WebshotReportContainer = ({
  children,
  cover,
}: {
  children: ReactNode;
  cover?: boolean;
}) => {
  return (
    <div
      className={cn({
        "relative flex h-[237mm] w-full break-after-page flex-col overflow-hidden bg-blue-50 pt-16":
          true,
        "pt-0": cover,
      })}
    >
      {children}
    </div>
  );
};
