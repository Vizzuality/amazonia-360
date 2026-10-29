import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGetTopicSummary } from "@/lib/ai";

import { ReportResultsSummary } from "./summary";

vi.mock("@/app/(frontend)/store", () => ({
  useFormTopics: () => ({ topics: [], setTopics: vi.fn() }),
}));
vi.mock("@/components/ui/editor", () => ({ ForwardRefEditor: () => null }));

type Mutation = ReturnType<typeof useGetTopicSummary>;

const mutation = (state: Partial<Mutation>) =>
  ({ isIdle: false, isPending: false, isError: false, reset: vi.fn(), ...state }) as Mutation;

describe("ReportResultsSummary", () => {
  it.each([
    ["error", "ai-summary-error", { isError: true, error: new Error("boom") }],
    ["no-data", "ai-summary-no-data", { data: { status: "no_data", included: 0, total: 2 } }],
  ] as const)("dismisses the %s message", (_, testId, state) => {
    const m = mutation(state as Partial<Mutation>);

    render(<ReportResultsSummary mutation={m} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ai-summary-dismiss" }));
    expect(m.reset).toHaveBeenCalledOnce();
  });
});
