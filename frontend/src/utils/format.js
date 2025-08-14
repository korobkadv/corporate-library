export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const kilobyte = 1024;
  const units = ["Bytes", "KB", "MB", "GB"];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(kilobyte));
  const size = parseFloat((bytes / Math.pow(kilobyte, unitIndex)).toFixed(2));
  return `${size} ${units[unitIndex]}`;
}
