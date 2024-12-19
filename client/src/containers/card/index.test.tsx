import { UseQueryResult } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { CardLoader, CardNoData } from "@/containers/card";

describe("CardLoader", () => {
  it("renders CardLoader component without crashing", () => {
    const { container } = render(
      <CardLoader query={[{ isFetching: true } as UseQueryResult<unknown, unknown>]}>
        <div role="presentation">Test</div>
      </CardLoader>,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders CardLoader Skeleton component when query is fetching", () => {
    const { container } = render(
      <CardLoader query={[{ isFetching: true } as UseQueryResult<unknown, unknown>]}>
        <div role="presentation">Test</div>
      </CardLoader>,
    );
    expect(container).toMatchSnapshot();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("renders CardLoader Children component when query is not fetching", () => {
    const { container } = render(
      <CardLoader query={[{ isFetching: false } as UseQueryResult<unknown, unknown>]}>
        <div role="presentation">Test</div>
      </CardLoader>,
    );
    expect(container).toMatchSnapshot();
    expect(screen.queryByRole("presentation")).toBeInTheDocument();
  });
});

describe("CardNoData", () => {
  it("renders CardNoData component without crashing", () => {
    const { container } = render(
      <CardNoData query={[{ isFetched: true } as UseQueryResult<unknown, unknown>]}>
        <div role="presentation">Test</div>
      </CardNoData>,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders CardNoData component when query is fetched and no data", () => {
    const { container } = render(
      <CardNoData query={[{ isFetched: true, data: [] } as UseQueryResult<unknown, unknown>]}>
        <div role="presentation">Test</div>
      </CardNoData>,
    );
    expect(container).toMatchSnapshot();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("renders CardNoData Children component when query is fetched and there is data", () => {
    const { container } = render(
      <CardNoData
        query={[{ isFetched: true, data: [{ value: 1 }] } as UseQueryResult<unknown, unknown>]}
      >
        <div role="presentation">Test</div>
      </CardNoData>,
    );
    expect(container).toMatchSnapshot();
    expect(screen.queryByRole("presentation")).toBeInTheDocument();
  });
});
