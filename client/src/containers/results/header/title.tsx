"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { LuPen, LuCheck, LuX } from "react-icons/lu";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { useFormTitle } from "@/app/(frontend)/store";

import { AuthWrapper } from "@/containers/auth/wrapper";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const renameSchema = z.object({
  title: z.string().min(1, "Title is required").max(60, "Title must be at most 60 characters"),
});

export default function TitleReport() {
  const t = useTranslations();

  const [title, setTitle] = useFormTitle();
  const [editMode, setEditMode] = useState(false);

  // const { id: reportId } = useParams();
  // const { data: reportData } = useReport({ id: `${reportId}` });

  const form = useForm({
    defaultValues: {
      title: title || "",
    },
    validators: {
      onSubmit: renameSchema,
    },
    onSubmit: async ({ value }) => {
      setTitle(value.title);
      setEditMode(false);
    },
  });

  const startEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    form.reset();
    setEditMode(false);
  };

  return (
    <div className="relative -ml-1.5 flex h-20 w-full grow items-center justify-between">
      {!editMode && (
        <header className="flex grow items-center space-x-4">
          <h2 className="border-b-2 border-l border-t-2 border-transparent px-1 py-2 text-2xl font-medium text-foreground lg:text-3xl tall:xl:text-4xl">
            {title ?? t("selected-area")}
          </h2>
          <AuthWrapper>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startEdit}
              aria-label={t("edit")}
              className="shrink-0 rounded-full"
            >
              <LuPen className="h-4 w-4 text-secondary-foreground" />
            </Button>
          </AuthWrapper>
        </header>
      )}

      {editMode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex grow items-center space-x-4"
        >
          <FieldGroup>
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      autoFocus={editMode}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      maxLength={60}
                      className={cn(
                        "mx-0 inline h-full w-full rounded-md bg-blue-50 px-1 py-2 text-2xl font-medium text-foreground shadow-none outline-none ring-2 ring-primary/40 focus:ring-0 lg:text-3xl tall:xl:text-4xl",
                      )}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              aria-label={t("save")}
              className="rounded-full"
              onClick={() => form.handleSubmit()}
            >
              <LuCheck className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              type="button"
              onClick={handleCancel}
              aria-label={t("cancel")}
              className="rounded-full"
            >
              <LuX className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
