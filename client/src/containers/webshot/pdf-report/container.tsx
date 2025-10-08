import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import PdfHeader from "@/containers/webshot/pdf-report/header";

export const PdfContainer = ({
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
        "relative flex h-screen w-full flex-col overflow-hidden bg-blue-50 pt-16": true,
        "pt-0": cover,
        "break-before-page": index !== 0,
      })}
    >
      <PdfHeader transparent={cover} />

      {children}
    </div>
  );
};

export default PdfContainer;
