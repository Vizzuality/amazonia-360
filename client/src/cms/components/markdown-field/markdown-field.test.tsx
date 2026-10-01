import { useState, type ComponentProps } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MarkdownField } from "./markdown-field";

const form = { value: vi.fn(), setValue: vi.fn(), locale: vi.fn() };

vi.mock("@payloadcms/ui", () => ({
  fieldBaseClass: "field-type",
  FieldLabel: ({ label }: { label?: string }) => <label>{label}</label>,
  FieldDescription: ({ description }: { description?: string }) => <p>{description}</p>,
  FieldError: () => null,
  useField: () => ({ path: "description", value: form.value(), setValue: form.setValue }),
  useLocale: () => ({ code: form.locale() }),
}));

/**
 * MDXEditor itself cannot be typed into under jsdom, so it is replaced by a stand-in that
 * behaves like it where this component depends on it: `markdown` is read once, on mount, and
 * changes are reported with a second argument flagging the normalisation emitted on load.
 */
vi.mock("./dynamic-editor", () => ({
  DynamicMarkdownEditor: ({
    markdown,
    readOnly,
    onChange,
  }: {
    markdown: string;
    readOnly?: boolean;
    onChange: (markdown: string, initialMarkdownNormalize: boolean) => void;
  }) => {
    const [initial] = useState(markdown);

    return (
      <div>
        <output data-testid="editor">{initial}</output>
        {readOnly && <span>read-only</span>}
        <button onClick={() => onChange(`${initial.trim()}\n`, true)}>normalise on load</button>
        <button onClick={() => onChange("**Edited**", false)}>edit</button>
      </div>
    );
  },
}));

const PROPS = {
  field: { name: "description", label: "Description", admin: { description: "Markdown." } },
  path: "description",
} as unknown as ComponentProps<typeof MarkdownField>;

describe("MarkdownField", () => {
  beforeEach(() => {
    form.value.mockReturnValue("## Area\n\nSome text.");
    form.locale.mockReturnValue("en");
  });

  test("opens the stored Markdown in the editor, with the field's label and description", () => {
    render(<MarkdownField {...PROPS} />);

    expect(screen.getByTestId("editor").textContent).toBe("## Area\n\nSome text.");
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Markdown.")).toBeInTheDocument();
  });

  test("an edit writes the Markdown back to the form", async () => {
    render(<MarkdownField {...PROPS} />);

    await userEvent.click(screen.getByRole("button", { name: "edit" }));

    expect(form.setValue).toHaveBeenCalledWith("**Edited**");
  });

  test("the editor rewriting the text on load does not count as an edit", async () => {
    render(<MarkdownField {...PROPS} />);

    await userEvent.click(screen.getByRole("button", { name: "normalise on load" }));

    expect(form.setValue).not.toHaveBeenCalled();
  });

  test("switching locale loads that locale's text", () => {
    const { rerender } = render(<MarkdownField {...PROPS} />);

    form.value.mockReturnValue("## Área\n\nAlgo de texto.");
    form.locale.mockReturnValue("es");
    rerender(<MarkdownField {...PROPS} />);

    expect(screen.getByTestId("editor").textContent).toBe("## Área\n\nAlgo de texto.");
  });

  test("an empty field opens an empty editor", () => {
    form.value.mockReturnValue(null);

    render(<MarkdownField {...PROPS} />);

    expect(screen.getByTestId("editor").textContent).toBe("");
  });

  test("a read-only field opens a read-only editor", () => {
    render(<MarkdownField {...PROPS} readOnly />);

    expect(screen.getByText("read-only")).toBeInTheDocument();
  });
});
