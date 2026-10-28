import { UseQueryResult } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import { CardState, CardStateActionsProvider, getCardStateStatus } from "@/containers/card/state";

const query = (state: Partial<UseQueryResult<unknown, unknown>> = {}) =>
  ({ isFetching: false, isError: false, refetch: vi.fn(), ...state }) as UseQueryResult<
    unknown,
    unknown
  >;

describe("getCardStateStatus", () => {
  it.each([
    { name: "fetching", q: [query({ isFetching: true })], isEmpty: false, expected: "loading" },
    {
      name: "refetching after an error",
      q: [query({ isFetching: true, isError: true })],
      isEmpty: true,
      expected: "loading",
    },
    {
      name: "a failed read",
      q: [query(), query({ isError: true })],
      isEmpty: true,
      expected: "unavailable",
    },
    { name: "an empty read", q: [query()], isEmpty: true, expected: "no_coverage" },
    { name: "a read with values", q: [query()], isEmpty: false, expected: "ok" },
  ])("is $expected for $name", ({ q, isEmpty, expected }) => {
    expect(getCardStateStatus(q, isEmpty)).toBe(expected);
  });
});

describe("CardState", () => {
  it("renders its children when the read has values", () => {
    render(
      <CardState query={[query()]} isEmpty={false}>
        <div>content</div>
      </CardState>,
    );

    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("shows a skeleton while fetching", () => {
    render(
      <CardState query={[query({ isFetching: true })]} isEmpty={false}>
        <div>content</div>
      </CardState>,
    );

    expect(screen.getByTestId("card-loader")).toBeInTheDocument();
    expect(screen.queryByText("content")).not.toBeInTheDocument();
  });

  it("offers Remove widget on no data when the card can be edited", () => {
    const onRemove = vi.fn();

    render(
      <CardStateActionsProvider onRemove={onRemove} retryable>
        <CardState query={[query()]} isEmpty>
          <div>content</div>
        </CardState>
      </CardStateActionsProvider>,
    );

    expect(screen.getByText("card-state-no-data-title")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "card-state-remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("shows no data without an action when the card cannot be edited", () => {
    render(
      <CardStateActionsProvider retryable>
        <CardState query={[query()]} isEmpty>
          <div>content</div>
        </CardState>
      </CardStateActionsProvider>,
    );

    expect(screen.getByTestId("card-state-no_coverage")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("refetches only the failed reads on Try again", () => {
    const ok = query();
    const failed = query({ isError: true });

    render(
      <CardState query={[ok, failed]} isEmpty>
        <div>content</div>
      </CardState>,
    );

    expect(screen.getByText("card-state-error-title")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "card-state-retry" }));
    expect(failed.refetch).toHaveBeenCalledOnce();
    expect(ok.refetch).not.toHaveBeenCalled();
  });

  it("drops Try again on a printed page", () => {
    render(
      <CardStateActionsProvider retryable={false}>
        <CardState query={[query({ isError: true })]} isEmpty={false}>
          <div>content</div>
        </CardState>
      </CardStateActionsProvider>,
    );

    expect(screen.getByTestId("card-state-unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the short Remove label inline", () => {
    render(
      <CardStateActionsProvider onRemove={vi.fn()} retryable>
        <CardState query={[query()]} isEmpty variant="inline">
          <div>content</div>
        </CardState>
      </CardStateActionsProvider>,
    );

    expect(screen.getByRole("button", { name: "card-state-remove-short" })).toBeInTheDocument();
  });
});
