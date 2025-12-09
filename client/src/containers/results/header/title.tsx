"use client";

import { ChangeEvent, useCallback, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { LuPen, LuCheck, LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useSyncTitle } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TitleReport() {
  const t = useTranslations();

  const [title, setTitle] = useSyncTitle();
  const [pendingTitle, setPendingTitle] = useState(title);
  const [editMode, setEditMode] = useState(false);
  const shouldSelect = useRef(false);

  const setInputRef = (el: HTMLInputElement | null) => {
    if (el && editMode && shouldSelect.current) {
      el.focus();
      el.select();
      shouldSelect.current = false;
    }
  };

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPendingTitle(value);
    },
    [setPendingTitle],
  );

  const id = "report-title-input";

  const startEdit = () => {
    setPendingTitle(title);
    shouldSelect.current = true;
    setEditMode(true);
  };

  const handleSave = useCallback(() => {
    setTitle(pendingTitle);
    shouldSelect.current = false;
    setEditMode(false);
  }, [pendingTitle, setTitle]);

  const handleCancel = () => {
    setPendingTitle(title);
    shouldSelect.current = false;
    setEditMode(false);
  };

  return (
    <div className="relative -ml-1.5 flex h-full w-full items-center justify-between">
      {!editMode && (
        <header className="flex items-center space-x-4">
          <h2 className="border border-transparent px-1 py-2 text-2xl font-medium text-foreground lg:text-3xl tall:xl:text-4xl">
            {title ?? t("selected-area")}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startEdit}
            aria-controls={id}
            aria-label={t("edit")}
            className="rounded-full"
          >
            <LuPen className="h-4 w-4 text-secondary-foreground" />
          </Button>
        </header>
      )}

      {editMode && (
        <header className="flex items-center space-x-4">
          <Input
            id={id}
            ref={setInputRef}
            autoFocus={editMode}
            value={pendingTitle ?? title ?? t("selected-area")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            onChange={onInputChange}
            readOnly={!editMode}
            aria-readonly={!editMode}
            className={cn(
              "mx-0 inline h-full w-fit rounded-md bg-blue-50 px-1 py-2 text-2xl font-medium text-foreground shadow-none outline-none ring-2 ring-primary/40 focus:ring-0 lg:text-3xl tall:xl:text-4xl",
            )}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={handleSave}
              aria-label={t("save")}
              className="rounded-full"
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
        </header>
      )}
    </div>
  );
}
