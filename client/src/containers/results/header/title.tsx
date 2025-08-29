"use client";

import { ChangeEvent, useCallback, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { LuPen, LuCheck, LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/store";

import { Input } from "@/components/ui/input";

export default function EditableHeader({ value = "Selected area" }: { value?: string }) {
  const t = useTranslations();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(value);
  const [pendingTitle, setPendingTitle] = useState(title);
  const [location, setLocation] = useSyncLocation();
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
      setLocation(location ? { ...location, custom_title: value as string } : location);
    },
    [setPendingTitle, setLocation, location],
  );

  const id = "report-title-input";

  const startEdit = () => {
    setPendingTitle(title);
    shouldSelect.current = true;
    setEditMode(true);
  };

  const handleSave = () => {
    setTitle(pendingTitle);
    shouldSelect.current = false;
    setEditMode(false);
  };

  const handleCancel = () => {
    setPendingTitle(title);
    shouldSelect.current = false;
    setEditMode(false);
  };

  return (
    <div className="sticky right-0 top-0 z-10 space-y-4 bg-blue-50 py-6 print:hidden">
      <div className="container">
        <div className="relative flex h-full w-fit">
          <label htmlFor={id} className="sr-only">
            {title}
          </label>

          <Input
            id={id}
            ref={setInputRef}
            autoFocus={editMode}
            value={editMode ? pendingTitle : title}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            onChange={onInputChange}
            readOnly={!editMode}
            aria-readonly={!editMode}
            aria-label={editMode ? (location?.custom_title ?? pendingTitle) : title}
            className={cn(
              "mx-0 inline h-full w-fit border-none bg-blue-50 px-0 py-2 text-2xl font-bold text-primary shadow-none outline-none focus:ring-0 lg:text-3xl tall:xl:text-4xl",
              editMode && "rounded-md px-1 ring-2 ring-primary/40",
            )}
          />

          {!editMode ? (
            <button
              type="button"
              onClick={startEdit}
              aria-controls={id}
              aria-label={t("edit")}
              className="p-1"
            >
              <LuPen className="ml-2.5 h-4 w-4 text-secondary-foreground" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button type="button" onClick={handleSave} aria-label={t("save")} className="p-1">
                <LuCheck className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleCancel} aria-label={t("cancel")} className="p-1">
                <LuX className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
