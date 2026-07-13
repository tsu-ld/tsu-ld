const THOUSAND = 1_000;
const MILLION = 1_000_000;

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatCompact(value: number): string {
  if (value >= MILLION) return `${(value / MILLION).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= THOUSAND) return `${(value / THOUSAND).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}
