import React from "react";

function getVariant(status) {
  switch (status.toLowerCase()) {
    // Order statuses
    case "approved":
    case "active":
    case "delivered":
    case "success":
    case "collected": // distribution: student has picked up
      return "success";

    case "pending":
    case "processing":
    case "confirmed":
      return "warning";

    case "rejected":
    case "cancelled":
    case "failed":
    case "inactive":
    case "refunded":
    case "returned": // distribution: item returned
      return "danger";

    case "shipped":
    case "ready_for_pickup": // distribution: arrived at school, awaiting collection
    case "info":
      return "info";

    default:
      return "default";
  }
}

function getLabel(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, className = "" }) {
  const variant = getVariant(status);
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {getLabel(status)}
    </span>
  );
}
