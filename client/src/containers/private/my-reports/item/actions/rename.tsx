"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useLocale } from "next-intl";
import { LuTextCursorInput } from "react-icons/lu";
import { toast } from "sonner";

import { useSaveReport } from "@/lib/report";

import { TopicView } from "@/app/(frontend)/parsers";

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

export const RenameAction = ({ report }: ReportActionsProps) => {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const saveMutation = useSaveReport();

  const form = useForm({
    defaultValues: {
      title: report.title || "",
      description: report.description || "",
    },
    onSubmit: async ({ value }) => {
      if (!report.location) return;

      const data = {
        id: report.id,
        title: value.title,
        description: value.description || null,
        topics: report.topics as TopicView[],
        location: report.location,
        locale,
        status: report._status,
      };

      toast.promise(saveMutation.mutateAsync(data), {
        loading: "Renaming report...",
        success: "Report renamed successfully!",
        error: "Failed to rename the report.",
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
        <span>Rename</span>
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename report</DialogTitle>
            <DialogDescription>Update the title and description of your report.</DialogDescription>
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
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
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
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
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
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
