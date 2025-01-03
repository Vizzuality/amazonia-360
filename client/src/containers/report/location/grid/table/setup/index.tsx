"use client";

import { LuSettings2 } from "react-icons/lu";

import { useGetGridMeta } from "@/lib/grid";

import { useSyncGridDatasets } from "@/app/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RANKING_DIRECTION = [
  {
    key: "asc",
    label: "Bottom",
  },
  {
    key: "desc",
    label: "Top",
  },
];

export default function GridTableSetup() {
  const [gridDatasets] = useSyncGridDatasets();
  const { data: rankingOptions } = useGetGridMeta({
    select: (data) =>
      gridDatasets.map((d) => ({
        key: d,
        label: data?.datasets?.find((dataset) => dataset.var_name === d)?.label,
      })),
  });

  return (
    <Popover>
      <PopoverTrigger>
        <LuSettings2 className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-auto bg-background p-2">
        <div className="space-y-4 p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-popover-foreground">Ranking setup</h2>
            <span className="text-sm text-muted-foreground">Define the order of the cells</span>
          </div>
          <div className="gap-2">
            <span className="text-sm text-foreground">Order by</span>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="h-10 flex-1 rounded-sm">
                  <SelectValue className="text-sm">
                    {/* <p className="max-w-64 truncate md:max-w-80 lg:max-w-none">
                    {[].find((opt) => opt.key === chartKey)?.label || ""}
                  </p> */}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
                  {rankingOptions &&
                    rankingOptions.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-10 max-w-32 rounded-sm">
                  <SelectValue className="text-sm">Bottom</SelectValue>
                </SelectTrigger>
                <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
                  {RANKING_DIRECTION &&
                    RANKING_DIRECTION.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="gap-2">
            <Label htmlFor="cells-number" className="text-sm text-foreground">
              Max number of cells
            </Label>
            <Input id="cell-number" className="h-10" />
            <span className="text-sm text-muted-foreground">
              Higher numbers will take more time.
            </span>
          </div>
          <div className="flex justify-end">
            <Button>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
