"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { shouldDismiss } from "@/lib/drawerLogic";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  actions,
  children,
}: DrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const dragStart = useRef<{ y: number; t: number } | null>(null);

  // Mount on open; animate out on external close (e.g. click-outside)
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setIsMounted(true);
    } else if (isMounted && !isClosingRef.current) {
      isClosingRef.current = true;
      animateClose(() => setIsMounted(false));
    }
  }, [isOpen, isMounted]);

  // Open animation — runs synchronously after the portal is painted
  useLayoutEffect(() => {
    if (!isMounted) return;
    if (!drawerRef.current || !backdropRef.current) return;
    gsap.fromTo(drawerRef.current, { y: "100%" }, { y: 0, duration: 0.42, ease: "power3.out" });
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28 });
  }, [isMounted]);

  // Scroll lock + Escape key + focus trap — all tied to isMounted
  useEffect(() => {
    if (!isMounted) return;

    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      // Focus trap
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  function animateClose(onComplete: () => void) {
    const drawer = drawerRef.current;
    const backdrop = backdropRef.current;
    if (drawer && backdrop) {
      gsap.to(drawer, { y: "100%", duration: 0.32, ease: "power2.in", onComplete });
      gsap.to(backdrop, { opacity: 0, duration: 0.22 });
    } else {
      onComplete();
    }
  }

  function handleClose() {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    onClose();
    animateClose(() => setIsMounted(false));
  }

  function handleTouchStart(e: React.TouchEvent) {
    dragStart.current = { y: e.touches[0].clientY, t: Date.now() };
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragStart.current || !drawerRef.current) return;
    const delta = e.touches[0].clientY - dragStart.current.y;
    if (delta > 0) gsap.set(drawerRef.current, { y: delta });
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!dragStart.current) return;
    const delta = e.changedTouches[0].clientY - dragStart.current.y;
    const velocity = delta / Math.max(Date.now() - dragStart.current.t, 1);
    dragStart.current = null;
    if (shouldDismiss(delta, velocity)) {
      handleClose();
    } else if (drawerRef.current) {
      gsap.to(drawerRef.current, { y: 0, duration: 0.3, ease: "power3.out" });
    }
  }

  if (!isMounted) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="klimt-drawer-backdrop"
      onMouseDown={(e) => {
        e.stopPropagation();
        handleClose();
      }}
    >
      <div
        ref={drawerRef}
        className="klimt-drawer"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="klimt-drawer-handle-row">
          <div className="klimt-drawer-handle" />
        </div>
        <div className="klimt-drawer-header">
          <span className="klimt-drawer-title">{title}</span>
          {actions && <div className="klimt-drawer-actions">{actions}</div>}
        </div>
        <div className="klimt-drawer-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
