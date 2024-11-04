import { cn } from "@/lib/utils";

export const PointIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="21"
      height="20"
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("stroke-current text-current", className)}
    >
      <path
        d="M6.66667 1.83333L7.33333 4.24999M4.91667 6.66666L2.5 5.99999M12.3332 3.41678L10.6665 5.00012M5.66659 10L4.08325 11.6667M8.1665 7.50004L12.3332 17.5L13.8332 13.1667L18.1665 11.6667L8.1665 7.50004Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
