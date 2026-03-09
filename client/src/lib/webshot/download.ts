export async function downloadBlobResponse(blob: Blob, filename: string) {
  if (!blob || !filename) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = decodeURIComponent(filename.trim());
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
