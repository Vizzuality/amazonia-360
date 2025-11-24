import { LuSearch } from "react-icons/lu";

import { Input } from "@/components/ui/input";

interface MyReportsSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const MyReportsSearch = ({ search, onSearchChange }: MyReportsSearchProps) => {
  return (
    <div className="relative">
      <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search reports..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
