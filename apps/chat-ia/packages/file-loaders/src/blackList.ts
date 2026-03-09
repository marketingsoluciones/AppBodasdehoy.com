// List of system files/directories to ignore
export const SYSTEM_FILES_TO_IGNORE = [
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '.localized',
  'ehthumbs.db',
  'ehthumbs_vista.db',
];

/**
 * Check if a file should be ignored (system files, macOS metadata, etc.)
 * @param filename - The filename to check
 * @returns true if the file should be ignored
 */
export function shouldIgnoreFile(filename: string): boolean {
  // Ignore macOS metadata files (AppleDouble files)
  if (filename.startsWith('._')) {
    return true;
  }

  // Check against the ignore list
  return SYSTEM_FILES_TO_IGNORE.includes(filename);
}
