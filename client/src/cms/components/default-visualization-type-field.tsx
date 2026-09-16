"use client";

import type { RadioFieldClientComponent } from "payload";

import { RadioGroupField, useFormFields } from "@payloadcms/ui";

import {
  NO_VISUALIZATION_TYPES_HINT,
  allowedDefaultOptions,
} from "@/cms/fields/default-visualization-type";

/**
 * Renders `default_visualization_type` with only the types the indicator declares in
 * `visualization_types`.
 *
 * This is the cosmetic half of the rule; the binding half is the `validate` on the
 * collection (see `cms/collections/Indicators.ts`). Payload's `radio` field has no
 * `filterOptions` — only `select` does — so narrowing the options on screen takes a
 * component. Both halves read `allowedDefaultOptions`, and neither should grow a filter of
 * its own: a radio this component offers but `validate` rejects is the exact failure this
 * arrangement exists to avoid.
 *
 * Wraps Payload's own `RadioGroupField` rather than drawing inputs, so the label,
 * description and validation error keep rendering the way every other field does. That
 * component is typed `any` upstream, so the props threaded through it are not checked by
 * the compiler.
 */
export const DefaultVisualizationTypeField: RadioFieldClientComponent = (props) => {
  // `visualization_types` is a sibling at the top level of the document, so its form path is
  // just its name.
  const visualizationTypes = useFormFields(([fields]) => fields?.visualization_types?.value);

  const options = allowedDefaultOptions(props.field.options, visualizationTypes);

  return (
    <>
      <RadioGroupField {...props} field={{ ...props.field, options }} />
      {options.length === 0 && <p className="field-description">{NO_VISUALIZATION_TYPES_HINT}</p>}
    </>
  );
};
