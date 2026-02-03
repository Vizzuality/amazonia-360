"use client";

import { useState, useCallback } from "react";

import type { DropEvent, FileRejection } from "react-dropzone";

import { useSetAtom } from "jotai";
<<<<<<< HEAD
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { convertFilesToGeometry, UploadErrorType } from "@/lib/geometry-upload";
=======

import {
  convertFilesToGeojson,
  geojsonToArcGIS,
  supportedFileformats,
  UploadErrorType,
} from "@/lib/geometry-upload";
>>>>>>> 1eb5aeb2 (Upload: working)
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
<<<<<<< HEAD
import { Markdown } from "@/components/ui/markdown";
=======
>>>>>>> 1eb5aeb2 (Upload: working)

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
<<<<<<< HEAD
  const t = useTranslations();
=======
  const [error, setError] = useState<string | null>(null);
>>>>>>> 1eb5aeb2 (Upload: working)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[] | undefined>(undefined);
  const setTmpBbox = useSetAtom(tmpBboxAtom);
  const [, setLocation] = useSyncLocation();

  const onDrop = useCallback(
    async (acceptedFiles: File[], _fileRejections: FileRejection[], _event: DropEvent) => {
<<<<<<< HEAD
      setIsUploading(true);
      setUploadedFiles(acceptedFiles);

      toast.promise(
        new Promise<void>(async (resolve, reject) => {
          try {
            const arcgisGeometry = await convertFilesToGeometry(acceptedFiles, {
              maxAreaSize: 10_000_000, // Adjust max area as needed (in square kilometers)
              validateBounds: true, // Validate if geometry intersects with area_afp
            });

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
            onOpenChange(false);
            resolve();
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

            setUploadedFiles(undefined);
            reject(errorMessage);
          } finally {
            setIsUploading(false);
          }
        }),
        {
          loading: t("upload-geometry-processing-files"),
          success: t("upload-geometry-success"),
          error: (err) => err,
        },
      );
    },
    [onOpenChange, setLocation, setTmpBbox, t],
=======
      setError(null);
      setIsUploading(true);
      setUploadedFiles(acceptedFiles);

      try {
        const geometry = await convertFilesToGeojson(acceptedFiles, {
          maxAreaSize: undefined, // Adjust max area as needed (in square meters)
        });

        // Convert GeoJSON to ArcGIS JSON format
        const arcgisGeometry = geojsonToArcGIS(geometry);

        // Set location with the uploaded geometry
        const geometryType = geometry.geometry.type.toLowerCase() as __esri.Geometry["type"];
        setLocation({
          type: geometryType,
          geometry: arcgisGeometry,
          buffer: BUFFERS[geometryType] || 0,
        });

        // Move map to the uploaded geometry
        const esriGeometry = getGeometryByType({
          type: geometryType,
          geometry: arcgisGeometry,
          buffer: BUFFERS[geometryType] || 0,
        });

        if (esriGeometry) {
          const bufferedGeometry = getGeometryWithBuffer(esriGeometry, BUFFERS[geometryType] || 0);
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
        let errorMessage = "An error occurred while uploading the file";

        switch (err) {
          case UploadErrorType.InvalidXMLSyntax:
            errorMessage = "Invalid XML syntax in the file";
            break;
          case UploadErrorType.SHPMissingFile:
            errorMessage = "Shapefile is missing required files (.shp, .shx, .dbf, .prj)";
            break;
          case UploadErrorType.UnsupportedFile:
            errorMessage = "Unsupported file format";
            break;
          case UploadErrorType.AreaTooBig:
            errorMessage = "The area is too large";
            break;
          case UploadErrorType.OutsideOfBounds:
            errorMessage = "The geometry is outside of the allowed bounds";
            break;
          default:
            errorMessage = "An unexpected error occurred";
        }

        setError(errorMessage);
        setUploadedFiles(undefined);
      } finally {
        setIsUploading(false);
      }
    },
    [onOpenChange, setLocation, setTmpBbox],
>>>>>>> 1eb5aeb2 (Upload: working)
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
<<<<<<< HEAD
=======
      setError(null);
>>>>>>> 1eb5aeb2 (Upload: working)
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
<<<<<<< HEAD
    "application/zip": [".zip"],
=======
>>>>>>> 1eb5aeb2 (Upload: working)
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
<<<<<<< HEAD
      <DialogContent
        className="sm:max-w-md"
        aria-describedby={t("upload-geometry-dialog-description")}
      >
        <DialogHeader>
          <DialogTitle>{t("upload-geometry-dialog-title")}</DialogTitle>
          <DialogDescription asChild>
            <Markdown>{t("upload-geometry-dialog-description")}</Markdown>
=======
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Geometry</DialogTitle>
          <DialogDescription>
            Upload a geometry file to draw on the map. Supported formats:{" "}
            {supportedFileformats.join(", ")}
>>>>>>> 1eb5aeb2 (Upload: working)
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
<<<<<<< HEAD
=======

          {isUploading && (
            <div className="text-center text-sm text-muted-foreground">Processing files...</div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
>>>>>>> 1eb5aeb2 (Upload: working)
        </div>
      </DialogContent>
    </Dialog>
  );
}
