"use client";

import React, { useEffect } from "react";

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "480px",
}) {
  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? "drawer-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`drawer-panel ${isOpen ? "drawer-panel--open" : ""}`}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">{title}</h2>
            {subtitle && <p className="drawer-subtitle">{subtitle}</p>}
          </div>
          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

/** Convenience component for a labelled detail row inside a drawer */
export function DrawerRow({ label, value }) {
  return (
    <div className="drawer-row">
      <span className="drawer-row-label">{label}</span>
      <span className="drawer-row-value">{value ?? "—"}</span>
    </div>
  );
}

/** Drawer section heading */
export function DrawerSection({ title }) {
  return <p className="drawer-section-title">{title}</p>;
}
