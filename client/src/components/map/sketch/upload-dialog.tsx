"use client";

import { useState, useCallback } from "react";

import type { DropEvent, FileRejection } from "react-dropzone";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import {
  convertFilesToGeojson,
  geojsonToArcGISCustom,
  UploadErrorType,
} from "@/lib/geometry-upload";
import { getGeometryByType, getGeometryWithBuffer } from "@/lib/location";

import { tmpBboxAtom, useSyncLocation } from "@/app/(frontend)/store";

import { BUFFERS } from "@/constants/map";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { Markdown } from "@/components/ui/markdown";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[] | undefined>(undefined);
  const setTmpBbox = useSetAtom(tmpBboxAtom);
  const [, setLocation] = useSyncLocation();

  const onDrop = useCallback(
    async (acceptedFiles: File[], _fileRejections: FileRejection[], _event: DropEvent) => {
      setError(null);
      setIsUploading(true);
      setUploadedFiles(acceptedFiles);

      try {
        const geometry = await convertFilesToGeojson(acceptedFiles, {
          maxAreaSize: undefined, // Adjust max area as needed (in square meters)
        });

        // Convert GeoJSON to ArcGIS JSON format
        const arcgisGeometry = geojsonToArcGISCustom(geometry);

        if (!arcgisGeometry || !arcgisGeometry.type) {
          throw UploadErrorType.UnsupportedFile;
        }

        setLocation({
          type: arcgisGeometry.type,
          geometry: arcgisGeometry as unknown as Record<string, unknown>,
          buffer: BUFFERS[arcgisGeometry.type] || 0,
        });

        // Move map to the uploaded geometry
        const esriGeometry = getGeometryByType({
          type: arcgisGeometry.type,
          geometry: arcgisGeometry as unknown as Record<string, unknown>,
          buffer: BUFFERS[arcgisGeometry.type] || 0,
        });

        if (esriGeometry) {
          const bufferedGeometry = getGeometryWithBuffer(
            esriGeometry,
            BUFFERS[arcgisGeometry.type] || 0,
          );
          if (bufferedGeometry) {
            setTmpBbox(bufferedGeometry.extent);
          }
        }

        // Reset state and close dialog
        setUploadedFiles(undefined);
        setError(null);
        onOpenChange(false);
      } catch (err) {
        // Handle different error types
        let errorMessage = t("generic-error");

        if (typeof err === "string") {
          switch (err) {
            case UploadErrorType.InvalidXMLSyntax:
              errorMessage = t("invalid-xml-syntax");
              break;
            case UploadErrorType.SHPMissingFile:
              errorMessage = t("shp-missing-file");
              break;
            case UploadErrorType.UnsupportedFile:
              errorMessage = t("unsupported-file");
              break;
            case UploadErrorType.AreaTooBig:
              errorMessage = t("area-too-big");
              break;
            case UploadErrorType.OutsideOfBounds:
              errorMessage = t("outside-of-bounds");
              break;
          }
        }

        setError(errorMessage);
        setUploadedFiles(undefined);
      } finally {
        setIsUploading(false);
      }
    },
    [onOpenChange, setLocation, setTmpBbox, t],
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setError(null);
      setUploadedFiles(undefined);
      setIsUploading(false);
    }
    onOpenChange(newOpen);
  };

  // Create accept object for dropzone
  const acceptedFormats = {
    "application/json": [".geojson", ".json"],
    "application/vnd.google-earth.kml+xml": [".kml"],
    "application/vnd.google-earth.kmz": [".kmz"],
    "application/x-esri-shape": [".shp", ".shx", ".dbf", ".prj", ".cpg"],
    "application/zip": [".zip"],
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby={t("upload-geometry-dialog-description")}
      >
        <DialogHeader>
          <DialogTitle>{t("upload-geometry-dialog-title")}</DialogTitle>
          <DialogDescription asChild>
            <Markdown>{t("upload-geometry-dialog-description")}</Markdown>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Dropzone
            accept={acceptedFormats}
            maxFiles={10}
            onDrop={onDrop}
            disabled={isUploading}
            src={uploadedFiles}
            className="min-h-[200px]"
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {isUploading && (
            <div className="text-center text-sm text-muted-foreground">
              {t("upload-geometry-processing-files")}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
