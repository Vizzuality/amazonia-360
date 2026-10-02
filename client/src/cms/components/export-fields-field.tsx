"use client";

import { type ComponentProps, useEffect } from "react";

import { FieldsToExport } from "@payloadcms/plugin-import-export/rsc";
import { useConfig, useDocumentInfo, useField, useListQuery } from "@payloadcms/ui";

import { isCatalogueSlug } from "@/cms/import-export/catalogue-slugs";
import { exportFieldPaths } from "@/cms/import-export/export-field-paths";

/**
 * The plugin's "Fields to export", preselecting every field for a catalogue collection instead
 * of the list view's columns, so an untouched export can be imported back whole. Other
 * collections keep the plugin's default.
 *
 * Both effects run on the same triggers, and a parent's effects run after its child's, so this
 * selection lands after the plugin's own and wins.
 */
export const ExportFieldsField = (props: ComponentProps<typeof FieldsToExport>) => {
  const { id } = useDocumentInfo();
  const { setValue } = useField<string[]>({ path: props.path });
  const { value: collectionSlug } = useField<string>({ path: "collectionSlug" });
  const { getEntityConfig } = useConfig();
  const { query } = useListQuery();

  const collectionConfig = isCatalogueSlug(collectionSlug)
    ? getEntityConfig({ collectionSlug })
    : undefined;

  useEffect(() => {
    if (id || !collectionConfig) return;

    const disabled: string[] =
      collectionConfig.admin?.custom?.["plugin-import-export"]?.disabledFields ?? [];
    setValue(exportFieldPaths(collectionConfig.fields, disabled));
  }, [id, collectionConfig, query?.columns, setValue]);

  return <FieldsToExport {...props} />;
};
