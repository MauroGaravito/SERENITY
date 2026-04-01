import { getStatusTone, toTitleCase } from "@/lib/providers";

export function StatusBadge({ value }: { value: string }) {
  const tone = getStatusTone(value as never);

  return <span className={`status-badge status-${tone}`}>{toTitleCase(value)}</span>;
}

