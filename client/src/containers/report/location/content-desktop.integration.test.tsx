import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { CustomLocation } from "@/app/(frontend)/parsers";
import { locationAtom } from "@/app/(frontend)/store";

import "@/styles/globals.css";

import { renderWithProviders } from "@integration/wrappers/render";

import SidebarLocationContent from "./content-desktop";

const POINT_LOCATION: CustomLocation = {
  type: "point",
  geometry: { x: -7013128, y: -334111, spatialReference: { wkid: 102100 } },
  buffer: 60,
};

const POLYGON_LOCATION: CustomLocation = {
  type: "polygon",
  geometry: {
    rings: [
      [
        [-7124000, -446000],
        [-6902000, -446000],
        [-6902000, -222000],
        [-7124000, -222000],
        [-7124000, -446000],
      ],
    ],
    spatialReference: { wkid: 102100 },
  },
  buffer: 0,
};

describe("SidebarLocationContent", () => {
  it("renders the heading and the point, area and line drawing buttons", async () => {
    const { screen } = await renderWithProviders(<SidebarLocationContent />);

    await expect
      .element(screen.getByRole("heading", { name: "Get insights on your area of interest" }))
      .toBeVisible();
    await expect.element(screen.getByText("Point", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Area", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Line", { exact: true })).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("shows the buffer control for a point location and updates the value via keyboard", async () => {
    const { screen } = await renderWithProviders(<SidebarLocationContent />, {
      initialAtoms: [[locationAtom, POINT_LOCATION]],
    });

    await expect.element(screen.getByText("Buffer size")).toBeVisible();
    await expect.element(screen.getByText("60 km")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();

    await userEvent.click(screen.getByRole("slider"));
    await userEvent.keyboard("{ArrowLeft}");

    await expect.element(screen.getByText("59 km")).toBeVisible();
  });

  it("hides the buffer control for a polygon location", async () => {
    const { screen } = await renderWithProviders(<SidebarLocationContent />, {
      initialAtoms: [[locationAtom, POLYGON_LOCATION]],
    });

    await expect.element(screen.getByText("Buffer size")).not.toBeInTheDocument();
    await expect(screen).toHaveNoA11yViolations();
  });
});
