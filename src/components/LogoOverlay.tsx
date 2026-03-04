"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { PadelPointBerlin } from "@/components/PadelPointBerlin";

interface LogoOverlayProps {
  sourceRect: DOMRect;
  onClose: () => void;
}

export default function LogoOverlay({ sourceRect, onClose }: LogoOverlayProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [logoKey, setLogoKey] = useState(0);
  const isClosingRef = useRef(false);

  function handleClose() {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    const container = containerRef.current;
    const backdrop = backdropRef.current;
    if (!container || !backdrop) {
      onClose();
      return;
    }

    gsap.to(container, {
      top: sourceRect.top,
      left: sourceRect.left,
      width: sourceRect.width,
      height: sourceRect.height,
      duration: 0.45,
      ease: "power3.inOut",
      onComplete: onClose,
    });
    gsap.to(backdrop, { opacity: 0, duration: 0.3 });
  }

  // Fly-in animation on mount
  useLayoutEffect(() => {
    const container = containerRef.current;
    const backdrop = backdropRef.current;
    if (!container || !backdrop) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const size = isMobile ? Math.min(vw * 0.75, vh * 0.75) : vh * 0.75;
    const targetTop = vh / 2 - size / 2;
    const targetLeft = vw / 2 - size / 2;

    // Set initial position matching source element
    gsap.set(container, {
      position: "fixed",
      top: sourceRect.top,
      left: sourceRect.left,
      width: sourceRect.width,
      height: sourceRect.height,
    });

    // Animate backdrop in
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });

    // Fly to center, then bump key to replay animation
    gsap.to(container, {
      top: targetTop,
      left: targetLeft,
      width: size,
      height: size,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: () => setLogoKey((k) => k + 1),
    });
  }, [sourceRect]);

  // Escape key to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  return createPortal(
    <>
      <div
        ref={backdropRef}
        className="klimt-logo-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div ref={containerRef} className="klimt-logo-overlay">
        <PadelPointBerlin key={logoKey} />
      </div>
    </>,
    document.body
  );
}
