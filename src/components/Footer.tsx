"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function formatCET(iso: string): string {
  return new Date(iso).toLocaleString("en-DE", {
    timeZone: "Europe/Berlin",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function Footer() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/poll-status")
      .then((r) => r.json())
      .then((data: { last_success_at?: string | null }) => {
        if (data.last_success_at) setLastUpdate(data.last_success_at);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="klimt-footer">
      <div className="klimt-footer-row">
        <span>&copy; {new Date().getFullYear()} PadelPoint Berlin</span>
        <Link href="/privacy" className="klimt-footer-link">
          Privacy Policy
        </Link>
      </div>
      {lastUpdate && (
        <div className="klimt-footer-update">
          Last update: {formatCET(lastUpdate)} (CET)
        </div>
      )}
    </footer>
  );
}
