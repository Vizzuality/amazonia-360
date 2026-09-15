import type { ComponentProps } from "react";

import type { Option } from "payload";

import { render, screen } from "@testing-library/react";

import { NO_VISUALIZATION_TYPES_HINT } from "@/cms/fields/default-visualization-type";

import { DefaultVisualizationTypeField } from "./default-visualization-type-field";

const formValue = vi.fn();

// Payload's own RadioGroupField is typed `any` and pulls in SCSS, so it is stubbed down to
// the one thing this component is responsible for: which options reach it.
vi.mock("@payloadcms/ui", () => ({
  RadioGroupField: ({ field }: { field: { options: Option[] } }) => (
    <ul data-testid="radios">
      {field.options.map((option) => (
        <li key={typeof option === "string" ? option : option.value}>
          {typeof option === "string" ? option : option.value}
        </li>
      ))}
    </ul>
  ),
  useFormFields: (selector: (args: [Record<string, { value: unknown }>]) => unknown) =>
    selector([{ visualization_types: { value: formValue() } }]),
}));

const OPTIONS: Option[] = [
  { label: "Map", value: "map" },
  { label: "Table", value: "table" },
  { label: "Chart", value: "chart" },
  { label: "Numeric", value: "numeric" },
];

// The component only reads `field.options`; Payload's other props are threaded straight
// through to RadioGroupField, which is stubbed above.
const PROPS = {
  field: { options: OPTIONS },
  path: "default_visualization_type",
} as unknown as ComponentProps<typeof DefaultVisualizationTypeField>;

const renderField = () => render(<DefaultVisualizationTypeField {...PROPS} />);

describe("DefaultVisualizationTypeField", () => {
  test("offers only the types the indicator declares", () => {
    formValue.mockReturnValue(["map", "chart"]);

    renderField();

    expect(screen.getByTestId("radios").textContent).toBe("mapchart");
    expect(screen.queryByText(NO_VISUALIZATION_TYPES_HINT)).not.toBeInTheDocument();
  });

  test("offers nothing and says why when no type is declared", () => {
    formValue.mockReturnValue([]);

    renderField();

    expect(screen.getByTestId("radios").textContent).toBe("");
    expect(screen.getByText(NO_VISUALIZATION_TYPES_HINT)).toBeInTheDocument();
  });
});
