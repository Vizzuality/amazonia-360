import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Resource from "./resource";
import { type ResourcesProps } from "./types";

export default function OtherResources() {
  const [tab, setTab] = useState("all");

  const RESOURCES: ResourcesProps = {
    multimedia: [
      {
        title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
        author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
        type: "document",
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
        type: "document",
      },
    ],
    database: [
      {
        title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
        author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
        type: "document",
      },
      {
        title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
        author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
        type: "database",
      },
    ],
    publications: [
      {
        title: "El teletrabajo en Bolivia: de la pandemia a la postpandemia",
        author: "Serrate, Liliana; Urquidi, Manuel; Aramayo, Fernando",
        type: "database",
      },
    ],
  };

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">Other resources</h2>
      <Tabs defaultValue={tab}>
        <TabsList className="w-full px-5">
          <TabsTrigger
            value="all"
            className="rounded-l-lg"
            onClick={() => setTab("all")}
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="publications"
            className="rounded-r-lg"
            onClick={() => setTab("publications")}
          >
            Publications
          </TabsTrigger>
          <TabsTrigger
            value="database"
            className="rounded-l-lg"
            onClick={() => setTab("database")}
          >
            Database
          </TabsTrigger>
          <TabsTrigger
            value="multimedia"
            className="rounded-r-lg"
            onClick={() => setTab("multimedia")}
          >
            Multimedia
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid grid-cols-4 gap-2">
            {Object.values(RESOURCES)
              .flat()
              .map((r, idx) => (
                <Resource key={idx} resource={r} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="publications">
          <div className="grid grid-cols-4 gap-2">
            {RESOURCES.publications.map((r, idx) => (
              <Resource key={idx} resource={r} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="database">
          <div className="grid grid-cols-4 gap-2">
            {RESOURCES.database.map((r, idx) => (
              <Resource key={idx} resource={r} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="multimedia">
          <div className="grid grid-cols-4 gap-2">
            {RESOURCES.multimedia.map((r, idx) => (
              <Resource key={idx} resource={r} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
