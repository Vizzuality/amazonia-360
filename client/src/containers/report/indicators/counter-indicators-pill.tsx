"use client";

export function CounterIndicatorsPill({
  activeIndicatorsLength,
  totalIndicatorsLength,
}: {
  activeIndicatorsLength: number;
  totalIndicatorsLength: number;
}) {
  return (
    <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
      {activeIndicatorsLength}/{totalIndicatorsLength}
    </span>
  );
}
