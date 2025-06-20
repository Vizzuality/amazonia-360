import { DialogTitle } from "@radix-ui/react-dialog";
import { LucideBookOpenText, LucideFilePenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LuBook,
  LuFileText,
  LuMessagesSquare,
  LuNewspaper,
  LuPenLine,
  LuUsers,
} from "react-icons/lu";

import { Card } from "@/containers/card";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";

import { ResourceProps } from "./types";

export default function Resource({
  Name,
  Type,
  Topic,
  Description,
  Year,
  Month,
  URL,
  Author,
  Country,
  Department,
  OrgUnit,
}: ResourceProps) {
  const t = useTranslations();
  return (
    <Card>
      <div className="flex grow flex-col items-center justify-between space-y-4 text-center">
        <header className="space-y-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            {Type === "Blogs" && (
              <LuPenLine size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Catalogs and Brochures" && (
              <LucideBookOpenText size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Co-Publications" && (
              <LuUsers size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Discussion Papers" && (
              <LuMessagesSquare size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Magazines" && (
              <LuNewspaper size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Monographs" && (
              <LuBook size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Technical Notes" && (
              <LucideFilePenLine size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Working Papers" && (
              <LuFileText size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <h3 title={Name} className="line-clamp-3 text-base font-semibold text-blue-500">
              {Name}
            </h3>
            <p className="text-xs font-semibold text-muted-foreground">
              {Month} {Year}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {Country.split(";")
                .map((c) => c.trim())
                .join(", ")}
            </p>
          </div>
        </header>
        <footer>
          <div className="flex w-full flex-col gap-x-2 gap-y-1 lg:flex-row">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full lg:w-1/2">
                  {t("info")}
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogTitle className="sr-only">{t("other-resources-resource-info")}</DialogTitle>
                <div className="flex flex-col space-y-4">
                  <h3 className="pr-4 text-lg font-semibold text-blue-500">{Name}</h3>
                  <p className="text-sm font-medium text-foreground">{Description}</p>
                  <div className="space-y-2 text-xs font-medium text-foreground">
                    <p>
                      <span className="font-semibold">{t("type")}:</span> {Type}
                    </p>
                    <p>
                      <span className="font-semibold">{t("topic")}:</span> {Topic}
                    </p>
                    <p>
                      <span className="font-semibold">{t("year")}:</span> {Year}
                    </p>
                    {Month && (
                      <p>
                        <span className="font-semibold">{t("month")}:</span> {Month}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">{t("URL")}:</span>{" "}
                      <a href={URL} target="_blank" rel="noreferrer">
                        {URL}
                      </a>
                    </p>
                    {Author && (
                      <p>
                        <span className="font-semibold">{t("author")}:</span> {Author}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold capitalize">{t("country")}:</span> {Country}
                    </p>
                    <p>
                      <span className="font-semibold">{t("department")}:</span> {Department}
                    </p>
                    <p>
                      {/* TO - DO - is this correct? OrgUnit */}
                      <span className="font-semibold">{t("org-unit")}:</span> {OrgUnit}
                    </p>
                  </div>
                </div>
                <DialogClose />
              </DialogContent>
            </Dialog>

            {!!URL && (
              <a
                className="inline-block w-full lg:w-1/2"
                href={URL}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="w-full">{t("download")}</Button>
              </a>
            )}
          </div>
        </footer>
      </div>
    </Card>
  );
}
