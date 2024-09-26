"use client";

import { MouseEvent } from "react";

import { useAtom } from "jotai";

import { cn } from "@/lib/utils";

import { sketchAtom, useSyncLocation } from "@/app/store";

import { SketchProps } from "@/components/map/sketch";

const SKETCH_BUTTONS = [
  {
    id: "point",
    label: "Point",
    icon: (
      <svg
        width="21"
        height="20"
        viewBox="0 0 21 20"
        fill="none"
        className="stroke-current text-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.66667 1.83333L7.33333 4.24999M4.91667 6.66666L2.5 5.99999M12.3332 3.41678L10.6665 5.00012M5.66659 10L4.08325 11.6667M8.1665 7.50004L12.3332 17.5L13.8332 13.1667L18.1665 11.6667L8.1665 7.50004Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "polygon",
    label: "Area",
    icon: (
      <svg
        width="21"
        height="20"
        viewBox="0 0 21 20"
        fill="none"
        className="stroke-current text-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.66667 1.66667C4.22464 1.66667 3.80072 1.84227 3.48816 2.15483C3.17559 2.46739 3 2.89131 3 3.33334M16.3333 1.66667C16.7754 1.66667 17.1993 1.84227 17.5118 2.15483C17.8244 2.46739 18 2.89131 18 3.33334M4.66667 16.6667C4.22464 16.6667 3.80072 16.4911 3.48816 16.1785C3.17559 15.866 3 15.442 3 15M8 1.66667H8.83333M8 16.6667H9.66667M12.1667 1.66667H13M3 6.66667V7.5M18 6.66667V8.33334M3 10.8333V11.6667M10.5 9.16667L13.8333 17.5L15.25 13.9167L18.8333 12.5L10.5 9.16667Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "polyline",
    label: "Line",
    icon: (
      <svg
        width="21"
        height="20"
        viewBox="0 0 21 20"
        fill="none"
        className="fill-current text-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          id="Vector"
          d="M1.68121 15.625C1.68121 16.6068 2.47714 17.4028 3.45898 17.4028C4.44082 17.4028 5.23676 16.6068 5.23676 15.625C5.23676 14.6432 4.44082 13.8472 3.45898 13.8472C2.47714 13.8472 1.68121 14.6432 1.68121 15.625ZM14.8062 3.75C14.8062 4.73184 15.6021 5.52778 16.584 5.52778C17.5658 5.52778 18.3618 4.73184 18.3618 3.75C18.3618 2.76816 17.5658 1.97222 16.584 1.97222C15.6021 1.97222 14.8062 2.76816 14.8062 3.75ZM3.68262 15.8722L4.2295 15.3774L3.78222 14.883L3.23535 15.3778L3.68262 15.8722ZM5.32325 14.3878L6.417 13.3982L5.96972 12.9039L4.87597 13.8934L5.32325 14.3878ZM7.51075 12.4086L8.6045 11.4191L8.15722 10.9247L7.06347 11.9143L7.51075 12.4086ZM9.69825 10.4295L10.2451 9.93468L9.79785 9.44032L9.25097 9.93511L9.69825 10.4295ZM10.2451 9.93468L10.792 9.43989L10.3447 8.94553L9.79785 9.44032L10.2451 9.93468ZM11.8857 8.4503L12.9795 7.46072L12.5322 6.96636L11.4385 7.95595L11.8857 8.4503ZM14.0732 6.47114L15.167 5.48155L14.7197 4.9872L13.626 5.97678L14.0732 6.47114ZM16.2607 4.49197L16.8076 3.99718L16.3603 3.50282L15.8135 3.99761L16.2607 4.49197Z"
        />
        <path
          id="Vector_2"
          d="M9.33398 9L9.51968 8.53576C9.33397 8.46148 9.12186 8.50502 8.98043 8.64645C8.839 8.78788 8.79546 8.99999 8.86975 9.1857L9.33398 9ZM12.6673 17.3333L12.2031 17.519C12.2791 17.7092 12.4635 17.8337 12.6683 17.8333C12.8731 17.8329 13.057 17.7076 13.1323 17.5172L12.6673 17.3333ZM14.084 13.75L13.9002 13.285C13.7716 13.3358 13.6698 13.4376 13.619 13.5662L14.084 13.75ZM17.6673 12.3333L17.8511 12.7983C18.0416 12.723 18.1669 12.5392 18.1673 12.3343C18.1677 12.1295 18.0432 11.9452 17.853 11.8691L17.6673 12.3333ZM8.86975 9.1857L12.2031 17.519L13.1316 17.1476L9.79822 8.8143L8.86975 9.1857ZM13.1323 17.5172L14.549 13.9338L13.619 13.5662L12.2023 17.1495L13.1323 17.5172ZM14.2678 14.215L17.8511 12.7983L17.4835 11.8684L13.9002 13.285L14.2678 14.215ZM17.853 11.8691L9.51968 8.53576L9.14829 9.46424L17.4816 12.7976L17.853 11.8691Z"
        />
      </svg>
    ),
  },
] as const;

export default function Sketch() {
  const [sketch, setSketch] = useAtom(sketchAtom);
  const [, setLocation] = useSyncLocation();

  const handleClick = (e: MouseEvent<HTMLButtonElement>, type: SketchProps["type"]) => {
    e.preventDefault();
    setLocation(null);

    if (sketch.enabled && sketch.type === type) {
      return setSketch({ enabled: false, type: undefined });
    }

    return setSketch({ enabled: true, type });
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center space-x-2 overflow-hidden rounded-[32px] text-sm tall:2xl:h-14",
        sketch.enabled && "space-x-0",
      )}
    >
      {SKETCH_BUTTONS.map((button) => {
        return (
          <button
            key={button.id}
            className={cn(
              "h-full w-full grow overflow-hidden rounded-[32px] bg-white transition-all duration-500 hover:bg-white/80",
              sketch.enabled &&
                sketch.type === button.id &&
                "w-full bg-primary text-white hover:bg-primary/80",
              sketch.enabled && sketch.type !== button.id && "w-0",
            )}
            onClick={(e) => handleClick(e, button.id)}
          >
            <div
              className={cn(
                "flex items-center justify-center space-x-2.5 transition-transform duration-300",
                sketch.enabled && sketch.type !== button.id && "scale-0",
              )}
            >
              {button.icon}
              <span className="transition-none">
                {sketch.enabled && sketch.type === button.id && "Cancel"}
                {sketch.enabled && sketch.type !== button.id && button.label}
                {!sketch.enabled && button.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
