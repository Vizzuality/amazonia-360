import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchC from "./index";

const mockMutate = vi.fn();
const mockSetLocation = vi.fn();

vi.mock("use-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/search", () => ({
  useGetSuggestions: ({ text }: { text: string }) => ({
    data: text
      ? {
          results: [
            { sourceIndex: 1, results: [{ text: "Acre, BRA", key: "1" }] },
            {
              sourceIndex: 2,
              results: [
                { text: "Acrelândia, Acre, BRA", key: "1" },
                { text: "Assis Brasil, Acre, BRA", key: "2" },
              ],
            },
          ],
        }
      : undefined,
    isFetching: false,
    isFetched: !!text,
  }),
  useGetMutationSearch: () => ({ mutate: mockMutate }),
}));

vi.mock("@/lib/location", () => ({
  getGeometryByType: vi.fn(),
  getGeometryWithBuffer: vi.fn(),
}));

vi.mock("@/lib/url-state/store", () => ({
  tmpBboxAtom: {},
  useSyncLocation: () => [null, mockSetLocation],
}));

vi.mock("jotai", () => ({
  useSetAtom: () => vi.fn(),
}));

const openAndType = async (text: string) => {
  const user = userEvent.setup();
  render(<SearchC />);
  await user.click(screen.getByRole("button"));
  await user.type(screen.getByRole("combobox"), text);
  return user;
};

describe("location search", () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockSetLocation.mockReset();
  });

  it("groups each suggestion under the location type of its source", async () => {
    await openAndType("Acre");

    const state = screen.getByRole("group", { name: "location-type-state" });
    const municipality = screen.getByRole("group", { name: "location-type-municipality" });

    expect(state).toHaveTextContent("Acre, BRA");
    expect(municipality).toHaveTextContent("Acrelândia, Acre, BRA");
    expect(municipality).toHaveTextContent("Assis Brasil, Acre, BRA");
  });

  it("searches the picked suggestion by its source index", async () => {
    const user = await openAndType("Acre");

    await user.click(screen.getByRole("option", { name: /Acrelândia/ }));

    expect(mockMutate).toHaveBeenCalledWith(
      { key: "1", sourceIndex: 2, text: "Acrelândia, Acre, BRA" },
      expect.anything(),
    );
  });
});
