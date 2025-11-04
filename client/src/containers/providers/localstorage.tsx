"use client";

import { ReactNode, createContext, useContext, useMemo } from "react";

export type ReportContextProps = {
  id: string;
};

export const ReportContext = createContext<ReportContextProps>({
  id: "",
});

export const ReportProvider: React.FC<{
  children?: ReactNode;
  id: string;
}> = ({ children, id }) => {
  const value = useMemo(
    () => ({
      id,
    }),
    [id],
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};

export function useReport(): ReportContextProps {
  const context = useContext(ReportContext);

  return context;
}
