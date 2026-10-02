/** The shape shared by config fields and the client fields the admin hands to components. */
type FieldLike = {
  type: string;
  name?: string;
  fields?: FieldLike[];
  tabs?: { name?: string; fields: FieldLike[] }[];
};

const join = (path: string, name: string) => (path ? `${path}.${name}` : name);

/**
 * Every path the plugin's "Fields to export" picker offers, in its order: groups and tabs are
 * opened up, while arrays and blocks are exported whole under their own name.
 */
export function exportFieldPaths(
  fields: readonly FieldLike[],
  disabled: readonly string[] = [],
  path = "",
): string[] {
  return fields.flatMap((field) => {
    if (field.type === "ui") return [];

    if (field.type === "tabs") {
      return (field.tabs ?? []).flatMap((tab) =>
        exportFieldPaths(tab.fields, disabled, tab.name ? join(path, tab.name) : path),
      );
    }

    const isArrayOrBlocks = field.type === "array" || field.type === "blocks";
    if (!isArrayOrBlocks && field.fields) {
      return exportFieldPaths(field.fields, disabled, field.name ? join(path, field.name) : path);
    }

    if (!field.name) return [];
    const value = join(path, field.name);
    const isDisabled = disabled.some((skip) => value === skip || value.startsWith(`${skip}.`));

    return isDisabled ? [] : [value];
  });
}
