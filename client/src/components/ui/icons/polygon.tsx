import { cn } from "@/lib/utils";

export const PolygonIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="21"
      height="20"
      viewBox="0 0 21 20"
      fill="none"
      className={cn("stroke-current text-current", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.66667 1.66667C4.22464 1.66667 3.80072 1.84227 3.48816 2.15483C3.17559 2.46739 3 2.89131 3 3.33334M16.3333 1.66667C16.7754 1.66667 17.1993 1.84227 17.5118 2.15483C17.8244 2.46739 18 2.89131 18 3.33334M4.66667 16.6667C4.22464 16.6667 3.80072 16.4911 3.48816 16.1785C3.17559 15.866 3 15.442 3 15M8 1.66667H8.83333M8 16.6667H9.66667M12.1667 1.66667H13M3 6.66667V7.5M18 6.66667V8.33334M3 10.8333V11.6667M10.5 9.16667L13.8333 17.5L15.25 13.9167L18.8333 12.5L10.5 9.16667Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
