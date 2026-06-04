interface Stat {
  label: string;
  value: number | string;
  icon: string;
  tone?: 'default' | 'warning' | 'success';
}

const tones: Record<NonNullable<Stat['tone']>, string> = {
  default: 'text-slate-900',
  warning: 'text-amber-600',
  success: 'text-green-600',
};

export function QuickStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{s.label}</span>
            <span className="text-lg">{s.icon}</span>
          </div>
          <p className={`mt-2 text-3xl font-semibold ${tones[s.tone ?? 'default']}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
