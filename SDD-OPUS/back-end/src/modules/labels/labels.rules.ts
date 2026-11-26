/** Case-insensitive identity of a label name inside a board (RN-S5, CA-E2). */
export function labelNameKey(name: string): string {
  return name.trim().toLowerCase();
}
