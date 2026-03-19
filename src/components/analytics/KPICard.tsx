interface Props {
  label: string;
  value: string | null;
  subtitle?: string;
}

export function KPICard({ label, value, subtitle }: Props) {
  return (
    <div className="klimt-kpi-card">
      <div className="klimt-kpi-value">{value ?? "—"}</div>
      <div className="klimt-kpi-label">{label}</div>
      {subtitle && <div className="klimt-kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
