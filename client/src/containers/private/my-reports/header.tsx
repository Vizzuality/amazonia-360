import { LuFilePlus } from "react-icons/lu";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export const MyReportsHeader = () => {
  return (
    <header className="flex items-center justify-between pb-10 pt-14">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-primary">My Reports</h1>
        <p className="text-sm font-medium text-muted-foreground">
          View and manage your published reports
        </p>
      </div>

      <div>
        <Link href="/reports">
          <Button size="lg" className="space-x-2">
            <LuFilePlus className="h-4 w-4" />
            <span>New report</span>
          </Button>
        </Link>
      </div>
    </header>
  );
};
