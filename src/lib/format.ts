export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} minutes ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / day)} days ago`;
  return new Date(iso).toLocaleDateString('en-US');
}

export function currency(value?: number | null): string {
  if (value == null) return 'TBD';
  return `¥${value.toLocaleString('en-US')}`;
}
