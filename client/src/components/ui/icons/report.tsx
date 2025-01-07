import { cn } from "@/lib/utils";

export const ReportIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-current text-current", className)}
    >
      <g id="report">
        <path
          id="Vector"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M6.66667 5C5.74619 5 5 5.74619 5 6.66667V25.3333C5 26.2538 5.74619 27 6.66667 27H25.3333C26.2538 27 27 26.2538 27 25.3333V6.66667C27 5.74619 26.2538 5 25.3333 5H6.66667ZM3 6.66667C3 4.64162 4.64162 3 6.66667 3H25.3333C27.3584 3 29 4.64162 29 6.66667V25.3333C29 27.3584 27.3584 29 25.3333 29H6.66667C4.64162 29 3 27.3584 3 25.3333V6.66667ZM11 10.6667C11 10.1144 11.4477 9.66667 12 9.66667H21.3333C21.8856 9.66667 22.3333 10.1144 22.3333 10.6667C22.3333 11.219 21.8856 11.6667 21.3333 11.6667H12C11.4477 11.6667 11 11.219 11 10.6667ZM9.66667 16C9.66667 15.4477 10.1144 15 10.6667 15H18.6667C19.219 15 19.6667 15.4477 19.6667 16C19.6667 16.5523 19.219 17 18.6667 17H10.6667C10.1144 17 9.66667 16.5523 9.66667 16ZM13.6667 21.3333C13.6667 20.781 14.1144 20.3333 14.6667 20.3333H21.3333C21.8856 20.3333 22.3333 20.781 22.3333 21.3333C22.3333 21.8856 21.8856 22.3333 21.3333 22.3333H14.6667C14.1144 22.3333 13.6667 21.8856 13.6667 21.3333Z"
          fill="#4BA6DE"
        />
      </g>
    </svg>
  );
};
