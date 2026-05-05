import React from "react";

// Maps raw API status values → display config
const STATUS_CONFIG = {
  // ── Order statuses (7-step) ─────────────────────────────────────
  awaiting_confirmation: { variant: "warning",  label: "Awaiting Confirmation" },
  processing:           { variant: "warning",  label: "Processing" },
  shipped:              { variant: "info",     label: "Shipped" },
  delivered:            { variant: "success",  label: "Delivered" },
  distributed:          { variant: "success",  label: "Distributed" },
  cancelled:            { variant: "danger",   label: "Cancelled" },
  refunded:             { variant: "danger",   label: "Refunded" },

  // ── Verification statuses ────────────────────────────────────────
  approved:   { variant: "success",  label: "Approved" },
  pending:    { variant: "warning",  label: "Pending" },
  rejected:   { variant: "danger",   label: "Rejected" },
  unverified: { variant: "default",  label: "Unverified" },

  // ── Generic ──────────────────────────────────────────────────────
  active:   { variant: "success", label: "Active" },
  inactive: { variant: "danger",  label: "Inactive" },
  success:  { variant: "success", label: "Success" },
  failed:   { variant: "danger",  label: "Failed" },
  info:     { variant: "info",    label: "Info" },

  // ── Exchange / return statuses ───────────────────────────────────
  vendor_approved:   { variant: "info",    label: "Vendor Approved" },
  pickup_scheduled:  { variant: "info",    label: "Pickup Scheduled" },
  picked_up:         { variant: "info",    label: "Picked Up" },
  new_item_shipped:  { variant: "info",    label: "New Item Shipped" },
  new_item_delivered:{ variant: "success", label: "New Item Delivered" },
  completed:         { variant: "success", label: "Completed" },
};

function getConfig(status) {
  const key = (status || "").toLowerCase().replace(/ /g, "_");
  if (STATUS_CONFIG[key]) return STATUS_CONFIG[key];
  // Fallback: humanize the raw value
  return {
    variant: "default",
    label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default function StatusBadge({ status, className = "" }) {
  const { variant, label } = getConfig(status);
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {label}
    </span>
  );
}
