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

import { ResourceProps } from "./types";

export default function Resource({ Name, Type, Topic }: ResourceProps) {
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
            <Button variant="outline" className="w-1/2">
              Info
            </Button>
            <Button className="w-1/2">Download</Button>
          </div>
        </footer>
      </div>
    </Card>
  );
}
