"use client";

import type { TextareaFieldClientComponent } from "payload";

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  fieldBaseClass,
  useField,
  useLocale,
} from "@payloadcms/ui";

import { DynamicMarkdownEditor } from "./dynamic-editor";

import "@mdxeditor/editor/style.css";
import "./markdown-field.scss";

/**
 * A `textarea` field edited as rich text and stored as Markdown.
 *
 * The value never stops being a string, so the API, versions and localisation see exactly
 * what a plain textarea would give them. Label, description and error are Payload's own, laid
 * out as `TextareaInput` lays them out.
 */
export const MarkdownField: TextareaFieldClientComponent = ({ field, path, readOnly }) => {
  const { label, localized, required, admin: { description } = {} } = field;
  const locale = useLocale();
  const { disabled, initialValue, setValue, showError, value } = useField<string>({
    potentiallyStalePath: path,
  });

  return (
    <div
      className={[fieldBaseClass, "markdown-field", showError && "error", readOnly && "read-only"]
        .filter(Boolean)
        .join(" ")}
    >
      <FieldLabel label={label} localized={localized} path={path} required={required} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} showError={showError} />
        <DynamicMarkdownEditor
          // MDXEditor reads `markdown` only when it mounts. Switching locale, restoring a version
          // or reverting to published replaces the form's initial value, so each of those gets a
          // fresh editor rather than an update it would ignore. Typing leaves it alone.
          key={`${locale?.code}:${initialValue ?? ""}`}
          className="markdown-field__editor"
          contentEditableClassName="markdown-field__content"
          markdown={value ?? ""}
          readOnly={readOnly || disabled}
          onChange={(markdown, initialMarkdownNormalize) => {
            // On load the editor emits its own rewrite of the stored text. Taking it would
            // mark the document modified before anyone has typed.
            if (!initialMarkdownNormalize) setValue(markdown);
          }}
        />
        <FieldDescription description={description} path={path} />
      </div>
    </div>
  );
};
