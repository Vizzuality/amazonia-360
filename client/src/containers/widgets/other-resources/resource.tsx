import {
  LuBarChart,
  LuDatabase,
  LuFileVideo2,
  LuFiles,
  LuListTodo,
  LuMap,
} from "react-icons/lu";

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
      <div className="flex flex-col grow space-y-4 text-center items-center justify-between">
        <header className="space-y-2">
          <div className="rounded-full w-20 h-20 bg-blue-50 flex items-center justify-center mx-auto">
            {Type === "Publication" && (
              <LuFiles size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Multimedia" && (
              <LuFileVideo2
                size={40}
                strokeWidth={1.5}
                className="text-blue-400"
              />
            )}
            {Type === "Database" && (
              <LuDatabase
                size={40}
                strokeWidth={1.5}
                className="text-blue-400"
              />
            )}
            {Type === "Survey" && (
              <LuListTodo
                size={40}
                strokeWidth={1.5}
                className="text-blue-400"
              />
            )}
            {Type === "Map" && (
              <LuMap size={40} strokeWidth={1.5} className="text-blue-400" />
            )}
            {Type === "Evaluations" && (
              <LuBarChart
                size={40}
                strokeWidth={1.5}
                className="text-blue-400"
              />
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <h3
              title={Name}
              className="text-base text-blue-500 font-semibold line-clamp-3"
            >
              {Name}
            </h3>
            <p className="text-xs text-gray-500 font-normal">Topic: {Topic}</p>
          </div>
        </header>
        <footer>
          <div className="flex space-x-4 w-full">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-1/2">
                  Info
                </Button>
              </DialogTrigger>

              <DialogContent>
                <div className="flex flex-col space-y-4">
                  <h3 className="text-lg text-blue-500 font-semibold pr-4">
                    {Name}
                  </h3>
                  <p className="text-sm text-foreground font-medium">
                    {Description}
                  </p>
                  <div className="text-xs text-foreground font-medium space-y-2">
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
                      <span className="font-semibold">Department:</span>{" "}
                      {Department}
                    </p>
                    <p>
                      <span className="font-semibold">OrgUnit:</span> {OrgUnit}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {!!URL && (
              <a
                className="inline-block w-1/2"
                href={URL}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="w-full">Download</Button>
              </a>
            )}
          </div>
        </footer>
      </div>
    </Card>
  );
}
