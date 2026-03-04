"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form and focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setBody("");
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);

      try {
        const res = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
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
    },
    [body, onSuccess, onClose]
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Add Match">
      <p className="klimt-modal-description">
        Paste a match including the Playtomic link, player list, venue, date and level.
      </p>

      <div className="klimt-modal-example">{EXAMPLE_MESSAGE}</div>

      <form onSubmit={handleSubmit}>
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
