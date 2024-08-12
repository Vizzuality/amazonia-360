import { LuBarChart, LuDatabase, LuFileVideo2, LuFiles, LuListTodo, LuMap } from "react-icons/lu";

import { Card } from "@/containers/card";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

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
  return (
    <Card>
      <div className="flex grow flex-col items-center justify-between space-y-4 text-center">
        <header className="space-y-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            {Type === "Publication" && (
              <LuFiles size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Multimedia" && (
              <LuFileVideo2 size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Database" && (
              <LuDatabase size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Survey" && (
              <LuListTodo size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Map" && <LuMap size={40} strokeWidth={1.5} className="text-blue-400" />}
            {Type === "Evaluations" && (
              <LuBarChart size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <h3 title={Name} className="line-clamp-3 text-base font-semibold text-blue-500">
              {Name}
            </h3>
            <p className="text-xs font-normal text-gray-500">Topic: {Topic}</p>
          </div>
        </header>
        <footer>
          <div className="flex w-full space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-1/2">
                  Info
                </Button>
              </DialogTrigger>

              <DialogContent>
                <div className="flex flex-col space-y-4">
                  <h3 className="pr-4 text-lg font-semibold text-blue-500">{Name}</h3>
                  <p className="text-sm font-medium text-foreground">{Description}</p>
                  <div className="space-y-2 text-xs font-medium text-foreground">
                    <p>
                      <span className="font-semibold">Type:</span> {Type}
                    </p>
                    <p>
                      <span className="font-semibold">Topic:</span> {Topic}
                    </p>
                    <p>
                      <span className="font-semibold">Year:</span> {Year}
                    </p>
                    {Month && (
                      <p>
                        <span className="font-semibold">Month:</span> {Month}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">URL:</span>{" "}
                      <a href={URL} target="_blank" rel="noreferrer">
                        {URL}
                      </a>
                    </p>
                    {Author && (
                      <p>
                        <span className="font-semibold">Author:</span> {Author}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Country:</span> {Country}
                    </p>
                    <p>
                      <span className="font-semibold">Department:</span> {Department}
                    </p>
                    <p>
                      <span className="font-semibold">OrgUnit:</span> {OrgUnit}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {!!URL && (
              <a className="inline-block w-1/2" href={URL} target="_blank" rel="noreferrer">
                <Button className="w-full">Download</Button>
              </a>
            )}
          </div>
        </footer>
      </div>
    </Card>
  );
}
