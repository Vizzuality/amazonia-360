"use client";

import { useTranslations } from "next-intl";
import Pluralize from "pluralize";

export interface TableTotalProps {
  total: number;
  pageIndex: number;
  pageSize: number;
}

export const TableTotal = ({ total, pageIndex, pageSize }: TableTotalProps) => {
  const t = useTranslations();
  const start = pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  {
    /* <p className="text-xs font-medium text-gray-500">{`${data.length} ${Pluralize(t("result"), data.length)}`}</p> */
  }

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
      <span>{`${start} - ${end}`}</span>
      {"/"}
      <strong>{`${total} ${Pluralize(t("result"), total)}`}</strong>
    </div>
  );
};
