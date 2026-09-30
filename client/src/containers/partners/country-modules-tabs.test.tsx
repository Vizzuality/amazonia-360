import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { vi } from "vitest";

import CountryModulePartnerships from "./country-modules";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/country/partners", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country/partners")>()),
  getPartnerCountryCodes: () => ["ECU", "BOL"],
}));

describe("CountryModulePartnerships tab selection", () => {
  it("writes only the selected country to the query, replacing history", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    render(
      <NuqsTestingAdapter searchParams="" onUrlUpdate={onUrlUpdate}>
        <CountryModulePartnerships />
      </NuqsTestingAdapter>,
    );

    const bolivia = screen.getByTestId("partners-country-tab-BOL");
    fireEvent.mouseDown(bolivia, { button: 0, ctrlKey: false });
    fireEvent.focus(bolivia);

    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const update = onUrlUpdate.mock.calls[0][0];
    expect(update.searchParams.toString()).toBe("country=BOL");
    expect(update.options.history).toBe("replace");
    expect(bolivia).toHaveAttribute("aria-selected", "true");
  });
});
