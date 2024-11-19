"use client";

export function CounterIndicatorsPill({
  activeIndicatorsLength,
}: {
  activeIndicatorsLength: number;
}) {
  return (
    <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
      {activeIndicatorsLength}
    </span>
  );
}
