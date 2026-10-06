export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  const index = Math.max(0, Math.min(to, copy.length));
  copy.splice(index, 0, item);
  return copy;
}
