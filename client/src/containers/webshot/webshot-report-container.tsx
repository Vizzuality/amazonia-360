import { ReactNode } from "react";

export const WebshotReportContainer = ({ children }: { children: ReactNode }) => {
  return <div className="flex h-[9.335in] w-full flex-col overflow-hidden">{children}</div>;
};
