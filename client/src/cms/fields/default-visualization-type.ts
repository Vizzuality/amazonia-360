import type { Option } from "payload";

/**
 * The dependency between an indicator's `visualization_types` and its
 * `default_visualization_type`, defined once.
 *
 * Both halves of the field import from here: the `validate` on the collection — which is
 * what actually enforces the rule, on the admin, the REST API and the seed alike — and the
 * admin component that renders the radios. Two halves are unavoidable: Payload's `radio`
 * field cannot filter its own options (`filterOptions` exists on `select` only), so the
 * rule has to be *applied* twice. Keeping it *defined* once is what stops the radios on
 * screen from drifting away from what the server will accept.
 */

const optionValue = (option: Option): string =>
  typeof option === "string" ? option : option.value;

/** `visualization_types` is a `string[]`, but reaches both call sites typed as `unknown`. */
const declaredTypes = (visualizationTypes: unknown): Set<string> =>
  new Set(
    Array.isArray(visualizationTypes)
      ? visualizationTypes.filter((type): type is string => typeof type === "string")
      : [],
  );

/** The options an indicator may pick a default from: the ones it actually offers. */
export const allowedDefaultOptions = (options: Option[], visualizationTypes: unknown): Option[] => {
  const declared = declaredTypes(visualizationTypes);

  return options.filter((option) => declared.has(optionValue(option)));
};

export const isAllowedDefault = (
  value: string,
  options: Option[],
  visualizationTypes: unknown,
): boolean =>
  allowedDefaultOptions(options, visualizationTypes).some(
    (option) => optionValue(option) === value,
  );

/**
 * Shown in place of the radios when nothing is selected above. Without it the field renders
 * as a label with an empty space under it, which reads as a loading failure rather than as
 * a dependency. 76 of 164 indicators (every h3 one) sit in this state.
 */
export const NO_VISUALIZATION_TYPES_HINT = "Select one or more visualization types first.";

/**
 * Names the offending value: the save that trips this is usually an edit to
 * `visualization_types`, so the error surfaces on a field the editor never touched.
 */
export const invalidDefaultMessage = (value: string): string =>
  `"${value}" is no longer one of this indicator's visualization types. Pick another default, or clear this field.`;
