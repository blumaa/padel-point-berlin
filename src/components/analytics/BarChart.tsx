interface BarItem {
  label: string;
  value: number;
}

interface Props {
  items: BarItem[];
  variant?: string;
  formatValue?: (value: number) => string;
  labelWidth?: number;
}

export function BarChart({ items, variant = "accent", formatValue, labelWidth }: Props) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const labelStyle = labelWidth ? { width: labelWidth, minWidth: labelWidth } : undefined;

  return (
    <>
      {items.map((item) => (
        <div key={item.label} className="klimt-bar-row">
          <span className="klimt-bar-label" style={labelStyle}>{item.label}</span>
          <div className="klimt-bar-track">
            <div
              className={`klimt-bar-fill klimt-bar-fill--${variant}`}
              style={{ width: `${(item.value / max) * 100}%`, transition: "width 0.3s ease-out" }}
            />
          </div>
          <span className="klimt-bar-value">
            {formatValue ? formatValue(item.value) : item.value}
          </span>
        </div>
      ))}
    </>
  );
}
