import { useState } from "react";

import { RESOURCES } from "@/containers/widgets/other-resources/mock";
import Resource from "@/containers/widgets/other-resources/resource";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OtherResources() {
  const [tab, setTab] = useState("all");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">Other resources</h2>
      <Tabs defaultValue={tab} className="flex flex-col space-y-4 items-start">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setTab("all")}>
            All ({Object.values(RESOURCES).flat().length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="publications"
            onClick={() => setTab("publications")}
          >
            Publications ({RESOURCES.publications.length || 0})
          </TabsTrigger>
          <TabsTrigger value="database" onClick={() => setTab("database")}>
            Database ({RESOURCES.database.length || 0})
          </TabsTrigger>
          <TabsTrigger value="multimedia" onClick={() => setTab("multimedia")}>
            Multimedia ({RESOURCES.multimedia.length || 0})
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
