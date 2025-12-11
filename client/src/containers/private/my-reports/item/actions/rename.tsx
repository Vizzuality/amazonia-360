"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { LuTextCursorInput } from "react-icons/lu";
import { toast } from "sonner";
import { z } from "zod";

import { useSaveReport } from "@/lib/report";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ReportActionsProps } from "./types";

const renameSchema = z.object({
  title: z.string().min(1, "Title is required").max(60, "Title must be at most 60 characters"),
  description: z.string().max(200, "Description must be at most 200 characters"),
});

export const RenameAction = ({ report }: ReportActionsProps) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const saveMutation = useSaveReport();

  const form = useForm({
    defaultValues: {
      title: report.title || "",
      description: report.description || "",
    },
    validators: {
      onSubmit: renameSchema,
    },
    onSubmit: async ({ value }) => {
      if (!report.location) return;

      const data = {
        id: report.id,
        title: value.title,
        description: value.description || null,
      };

      toast.promise(saveMutation.mutateAsync(data), {
        loading: t("my-reports-rename-toast-loading"),
        success: t("my-reports-rename-toast-success"),
        error: t("my-reports-rename-toast-error"),
      });

      setOpen(false);
    },
  });

  return (
    <>
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
      >
        <LuTextCursorInput className="mr-2 h-4 w-4" />
        <span>{t("my-reports-action-rename")}</span>
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("my-reports-rename-dialog-title")}</DialogTitle>
            <DialogDescription>{t("my-reports-rename-dialog-description")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="title">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t("my-reports-rename-field-title")}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        maxLength={60}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="description">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t("my-reports-rename-field-description")}
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        rows={3}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">{t("my-reports-rename-button-save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
