"use client";

import { formatNumber } from "@/lib/formats";

import { useSyncFires, useSyncPopulation } from "@/app/store";

import { Slider } from "@/components/ui/slider";
import { FIRES } from "@/constants/colors";
import { getKeys } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function Sidebar() {
  const [population, setPopulation] = useSyncPopulation();
  const [fires, setFires] = useSyncFires();

  const handleCheckedChange = ({
    checked,
    value,
  }: {
    checked: string | boolean;
    value: number;
  }) => {
    if (checked) {
      setFires([...fires, value]);
    } else {
      setFires(fires.filter((fire) => fire !== value));
    }
  }

  return (
    <div className="w-96 p-5 bg-white border-r border-gray-200">
      <h2 className="text-lg font-medium">Filters</h2>

      <div className="space-y-2">
        <h3 className="text-sm font-medium mt-4">Population</h3>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">
              {formatNumber(population[0])}
            </span>
            <span className="text-xs text-gray-500 float-right">
              {formatNumber(population[1])}
            </span>
          </div>

          <Slider
            min={1}
            max={50000}
            step={1}
            value={population}
            minStepsBetweenThumbs={1}
            onValueChange={setPopulation}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium mt-4">Fires</h3>

        <div className="space-y-1">
          <div className="flex flex-col justify-between gap-1">
            {getKeys(FIRES).map((key) => (
              <div className="flex space-x-1 items-center">
                <Checkbox checked={fires.includes(+key)} onCheckedChange={(checked) => handleCheckedChange({ checked, value: +key})} />
                <span key={key} className="text-xs text-gray-500">
                  {FIRES[key].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
