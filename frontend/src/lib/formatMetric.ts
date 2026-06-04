export function formatMetricValue(value: number, format?: string | null): string {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percentage':
      return `${value}%`;
    default:
      return value.toLocaleString('es-EC');
  }
}

export type StaleVariant = 'fresh' | 'aging' | 'stale';

export interface StaleStatus {
  label: string;
  variant: StaleVariant;
}

export function getStaleStatus(verifiedAt: string, isStale = false): StaleStatus {
  const hours = (Date.now() - new Date(verifiedAt).getTime()) / 3600000;
  if (isStale || hours >= 48) {
    return { label: '⚠️ STALE >48h', variant: 'stale' };
  }
  if (hours < 6) {
    const mins = Math.max(1, Math.round(hours * 60));
    return { label: `Verificado hace ${mins} min`, variant: 'fresh' };
  }
  return { label: `Verificado hace ${Math.round(hours)}h`, variant: 'aging' };
}
