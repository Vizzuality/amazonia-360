"use client";

import { Button } from "@/components/ui/button";

export const PrintButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button className="fixed bottom-4 right-4 z-50 print:hidden" size="lg" onClick={onClick}>
      Print
    </Button>
  );
};

export default PrintButton;
