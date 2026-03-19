import type { ReactNode } from "react";

interface Props {
  heading: string;
  subtitle?: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function StatSection({ heading, subtitle, children, defaultCollapsed }: Props) {
  if (defaultCollapsed) {
    return (
      <details className="klimt-stat-card">
        <summary className="klimt-stat-heading klimt-stat-heading--toggle">{heading}</summary>
        {subtitle && <p className="klimt-stat-subtitle">{subtitle}</p>}
        {children}
      </details>
    );
  }

  return (
    <section className="klimt-stat-card">
      <h2 className="klimt-stat-heading">{heading}</h2>
      {subtitle && <p className="klimt-stat-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}
