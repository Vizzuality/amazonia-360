"use client";

import { createContext, useContext, ReactNode } from "react";

import { useDropzone } from "react-dropzone";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";

<<<<<<< HEAD
import { useTranslations } from "next-intl";
=======
>>>>>>> 1eb5aeb2 (Upload: working)
import { LuUpload } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

interface DropzoneContextType {
  src?: File[];
  accept?: DropzoneOptions["accept"];
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  maxFiles?: DropzoneOptions["maxFiles"];
}

<<<<<<< HEAD
=======
const renderBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)}${units[unitIndex]}`;
};

>>>>>>> 1eb5aeb2 (Upload: working)
const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
  src?: File[];
  className?: string;
  onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
  children?: ReactNode;
};

export const Dropzone = ({
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  children,
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    minSize,
    onError,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        const message = fileRejections.at(0)?.errors.at(0)?.message;
        onError?.(new Error(message));
        return;
      }

      onDrop?.(acceptedFiles, fileRejections, event);
    },
    ...props,
  });

  return (
    <DropzoneContext.Provider
      key={JSON.stringify(src)}
      value={{ src, accept, maxSize, minSize, maxFiles }}
    >
      <Button
        className={cn(
          "relative h-auto w-full flex-col overflow-hidden p-8",
          isDragActive && "outline-none ring-1 ring-ring",
          className,
        )}
        disabled={disabled}
        type="button"
        variant="outline"
        {...getRootProps()}
      >
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </Button>
    </DropzoneContext.Provider>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export interface DropzoneContentProps {
  children?: ReactNode;
  className?: string;
}

const maxLabelItems = 3;

export const DropzoneContent = ({ children, className }: DropzoneContentProps) => {
  const { src } = useDropzoneContext();
<<<<<<< HEAD
  const t = useTranslations();
=======
>>>>>>> 1eb5aeb2 (Upload: working)

  if (!src) {
    return null;
  }

  if (children) {
    return children;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <LuUpload size={16} />
      </div>
      <p className="my-2 w-full truncate text-sm font-medium">
        {src.length > maxLabelItems
          ? `${new Intl.ListFormat("en").format(
              src.slice(0, maxLabelItems).map((file) => file.name),
<<<<<<< HEAD
            )} ${t("dropzone-and-more", { count: src.length - maxLabelItems })}`
          : new Intl.ListFormat("en").format(src.map((file) => file.name))}
      </p>
      <p className="w-full text-wrap text-xs text-muted-foreground">
        {t("dropzone-drag-drop-replace")}
=======
            )} and ${src.length - maxLabelItems} more`
          : new Intl.ListFormat("en").format(src.map((file) => file.name))}
      </p>
      <p className="w-full text-wrap text-xs text-muted-foreground">
        Drag and drop or click to replace
>>>>>>> 1eb5aeb2 (Upload: working)
      </p>
    </div>
  );
};

export interface DropzoneEmptyStateProps {
  children?: ReactNode;
  className?: string;
}

export const DropzoneEmptyState = ({ children, className }: DropzoneEmptyStateProps) => {
<<<<<<< HEAD
  const { src, maxFiles } = useDropzoneContext();
  const t = useTranslations();
=======
  const { src, accept, maxSize, minSize, maxFiles } = useDropzoneContext();
>>>>>>> 1eb5aeb2 (Upload: working)

  if (src) {
    return null;
  }

  if (children) {
    return children;
  }

<<<<<<< HEAD
=======
  let caption = "";

  if (accept) {
    caption += "Accepts ";
    caption += new Intl.ListFormat("en").format(Object.keys(accept));
  }

  if (minSize && maxSize) {
    caption += ` between ${renderBytes(minSize)} and ${renderBytes(maxSize)}`;
  } else if (minSize) {
    caption += ` at least ${renderBytes(minSize)}`;
  } else if (maxSize) {
    caption += ` less than ${renderBytes(maxSize)}`;
  }

>>>>>>> 1eb5aeb2 (Upload: working)
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <LuUpload size={16} />
      </div>
      <p className="my-2 w-full truncate text-wrap text-sm font-medium">
<<<<<<< HEAD
        {maxFiles === 1 ? t("dropzone-upload-file") : t("dropzone-upload-files")}
      </p>
      <p className="w-full truncate text-wrap text-xs text-muted-foreground">
        {t("dropzone-drag-drop-upload")}
      </p>
=======
        Upload {maxFiles === 1 ? "a file" : "files"}
      </p>
      <p className="w-full truncate text-wrap text-xs text-muted-foreground">
        Drag and drop or click to upload
      </p>
      {caption && <p className="text-wrap text-xs text-muted-foreground">{caption}.</p>}
>>>>>>> 1eb5aeb2 (Upload: working)
    </div>
  );
};
