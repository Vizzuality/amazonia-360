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
        "relative mx-auto h-[210mm] w-[297mm] bg-blue-50 shadow-lg": true,
        "break-before-page": index !== 0,
        "print:mx-0 print:origin-top-left print:scale-[1.15] print:shadow-none": true,
      })}
    >
      <PdfHeader transparent={cover} />

      <div
        className={cn("flex h-full flex-col pt-16", {
          "pt-0": cover,
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default PdfContainer;
