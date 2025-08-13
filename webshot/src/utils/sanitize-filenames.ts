export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^A-Za-z0-9\.\-_]/g, "");
};
