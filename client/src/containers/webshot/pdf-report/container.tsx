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
        "relative flex h-[212.5mm] w-full flex-col overflow-hidden bg-blue-50": true,
        "pt-0": cover,
        "break-before-page": index !== 0,
      })}
    >
      <PdfHeader transparent={cover} />

      <div className="flex h-full flex-col pt-16">{children}</div>
    </div>
  );
};

export default PdfContainer;
