import { useState } from "react";

import WidgetsColumn from "@/containers/widgets/column";
import { RESOURCES } from "@/containers/widgets/other-resources/mock";
import Resource from "@/containers/widgets/other-resources/resource";
import WidgetsRow from "@/containers/widgets/row";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OtherResources() {
  const [tab, setTab] = useState("all");

  return (
    <div className="container print:break-before-page">
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
          <WidgetsRow className="print:grid-cols-2">
            {Object.values(RESOURCES)
              .flat()
              .map((r, idx) => (
                <WidgetsColumn
                  className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
                  key={idx}
                >
                  <Resource key={idx} resource={r} />
                </WidgetsColumn>
              ))}
          </WidgetsRow>
        </TabsContent>
        <TabsContent value="publications">
          <WidgetsRow className="print:grid-cols-2">
            {RESOURCES.publications.map((r, idx) => (
              <WidgetsColumn
                className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
                key={idx}
              >
                <Resource key={idx} resource={r} />
              </WidgetsColumn>
            ))}
          </WidgetsRow>
        </TabsContent>
        <TabsContent value="database">
          <WidgetsRow className="print:grid-cols-2">
            {RESOURCES.database.map((r, idx) => (
              <WidgetsColumn
                className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
                key={idx}
              >
                <Resource key={idx} resource={r} />
              </WidgetsColumn>
            ))}
          </WidgetsRow>
        </TabsContent>
        <TabsContent value="multimedia">
          <WidgetsRow className="print:grid-cols-2">
            {RESOURCES.multimedia.map((r, idx) => (
              <WidgetsColumn
                className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
                key={idx}
              >
                <Resource key={idx} resource={r} />
              </WidgetsColumn>
            ))}
          </WidgetsRow>
        </TabsContent>
      </Tabs>
    </div>
  );
}
