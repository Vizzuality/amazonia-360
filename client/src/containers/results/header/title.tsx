"use client";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { LuPen, LuCheck, LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditableHeader({ value = "Selected area" }: { value?: string }) {
  const t = useTranslations();
  const [location, setLocation] = useSyncLocation();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(location?.custom_title ?? value);
  const [pendingTitle, setPendingTitle] = useState(title);
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

    setLocation(location ? { ...location, custom_title: pendingTitle } : location);
  }, [location, pendingTitle, setLocation]);

  const handleCancel = () => {
    setPendingTitle(title);
    shouldSelect.current = false;
    setEditMode(false);
  };

  const TITLE = useMemo(() => location?.custom_title ?? title, [location, title]);

  return (
    <div className="sticky right-0 top-0 z-10 space-y-4 bg-blue-50 py-6 print:hidden">
      <div className="container">
        <div className="relative flex h-full w-fit">
          <label htmlFor={id} className="sr-only">
            {title}
          </label>

          {!editMode && (
            <header className="flex items-center space-x-4">
              <h2 className="px-1 py-2 text-2xl font-bold text-primary lg:text-3xl tall:xl:text-4xl">
                {TITLE}
              </h2>
              <Button
                type="button"
                variant="outline"
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
                value={pendingTitle ?? TITLE}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                onChange={onInputChange}
                readOnly={!editMode}
                aria-readonly={!editMode}
                aria-label={editMode ? (location?.custom_title ?? pendingTitle) : title}
                className={cn(
                  "mx-0 inline h-full w-fit rounded-md border-none bg-blue-50 px-1 py-2 text-2xl font-bold text-primary shadow-none outline-none ring-2 ring-primary/40 focus:ring-0 lg:text-3xl tall:xl:text-4xl",
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
      </div>
    </div>
  );
}
