import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

interface MyReportsFooterProps {
  page: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

export const MyReportsFooter = ({
  page,
  totalPages,
  totalDocs,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: MyReportsFooterProps) => {
  if (totalDocs === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Showing page {page} of {totalPages}
        {" • "}
        {totalDocs} total reports
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          <LuChevronLeft className="h-4 w-4" />
          <span className="ml-1">Previous</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          <span className="mr-1">Next</span>
          <LuChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
