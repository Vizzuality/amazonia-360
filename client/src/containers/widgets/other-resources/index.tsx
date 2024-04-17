import { Files, FileVideo2, DatabaseIcon } from "lucide-react";

import { Card } from "@/containers/card";

import { Button } from "@/components/ui/button";

export default function OtherResources() {
  type ResourcesProps = {
    title: string;
    author: string;
    type: "database" | "publication" | "multimedia";
  }[];

  const RESOURCES: ResourcesProps = [
    {
      title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
      author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
      type: "publication",
    },
    {
      title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
      author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
      type: "database",
    },
    {
      title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
      author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
      type: "multimedia",
    },
    {
      title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
      author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
      type: "publication",
    },
  ];
  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">Other resources</h2>
      <div className="grid grid-cols-4 gap-2">
        {RESOURCES.map((resource, idx) => (
          <Card key={idx}>
            <div className="flex flex-col space-y-4 text-center items-center">
              <div className="rounded-full w-20 h-20 bg-blue-50 flex items-center justify-center">
                {resource.type === "publication" && (
                  <Files
                    size={40}
                    strokeWidth={1.5}
                    className="text-blue-400"
                  />
                )}
                {resource.type === "multimedia" && (
                  <FileVideo2
                    size={40}
                    strokeWidth={1.5}
                    className="text-blue-400"
                  />
                )}
                {resource.type === "database" && (
                  <DatabaseIcon
                    size={40}
                    strokeWidth={1.5}
                    className="text-blue-400"
                  />
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <h3 className="text-base text-blue-500 font-semibold">
                  {resource.title}
                </h3>
                <p className="text-xs text-gray-500 font-normal">
                  Author: {resource.author}
                </p>
              </div>
              <div className="flex space-x-4 w-full">
                <Button variant="outline" className="w-1/2">
                  Info
                </Button>
                <Button className="w-1/2">Download</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
