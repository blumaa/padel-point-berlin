"use client";

import { useState, useEffect, useRef } from "react";
import Drawer from "@/components/Drawer";

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXAMPLE_MESSAGE = `*MATCH IN PADELHAUS GMBH*

📅 Mittwoch 04., 09:00 (90min)
📍 Berlin
📊 Level 2.28 - 3.28
✅ Michael Reimer (2,5
✅ Alexander Foth (2,7
⚪ ??
⚪ ??
https://app.playtomic.io/t/azqw9n9O`;

export default function AddMatchModal({ isOpen, onClose, onSuccess }: AddMatchModalProps) {
  const [body, setBody] = useState("");
  const [indoor, setIndoor] = useState<"indoor" | "outdoor" | null>(null);
  const [competitionMode, setCompetitionMode] = useState<"friendly" | "competitive" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBody("");
      setIndoor(null);
      setCompetitionMode(null);
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    if (indoor === null) {
      setError("Please select a court type (Indoor or Outdoor).");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, indoor, competitionMode }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Add Match">
      <p className="klimt-modal-description">
        Paste a match including the Playtomic link, player list, venue, date and level. Select the court type below.
      </p>

      <div className="klimt-modal-example">{EXAMPLE_MESSAGE}</div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
          <div className="klimt-filter-section">
            <span className="klimt-filter-label">Court Type</span>
            <div className="klimt-filter-pills">
              {(["indoor", "outdoor"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`klimt-pill${indoor === opt ? " klimt-pill--active" : ""}`}
                  onClick={() => setIndoor(opt)}
                  disabled={isSubmitting}
                >
                  {opt === "indoor" ? "Indoor" : "Outdoor"}
                </button>
              ))}
            </div>
          </div>
          <div className="klimt-filter-section">
            <span className="klimt-filter-label">Match Type</span>
            <div className="klimt-filter-pills">
              {(["friendly", "competitive"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`klimt-pill${competitionMode === opt ? " klimt-pill--active" : ""}`}
                  onClick={() => setCompetitionMode(opt)}
                  disabled={isSubmitting}
                >
                  {opt === "friendly" ? "Friendly" : "Competitive"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label htmlFor="match-textarea" className="sr-only">
          Match message
        </label>
        <textarea
          ref={textareaRef}
          id="match-textarea"
          className="klimt-input klimt-modal-textarea"
          rows={8}
          placeholder="Paste match message here…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isSubmitting}
        />

        {error && <p className="klimt-modal-error">{error}</p>}

        <button
          type="submit"
          className="klimt-cta klimt-modal-submit"
          disabled={isSubmitting || body.trim().length === 0}
        >
          {isSubmitting ? "Adding…" : "Add Match"}
        </button>
      </form>
    </Drawer>
  );
}
