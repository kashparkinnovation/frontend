"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function ImpersonationBanner() {
  const [isAdminImpersonating, setIsAdminImpersonating] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleCheck = () => {
      setIsAdminImpersonating(!!Cookies.get("admin_access_token"));
    };
    handleCheck();
    const interval = setInterval(handleCheck, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReturnToAdmin = () => {
    const adminAccess = Cookies.get("admin_access_token");
    const adminRefresh = Cookies.get("admin_refresh_token");
    const adminUser = Cookies.get("admin_user");

    if (adminAccess) {
      Cookies.set("access_token", adminAccess, { path: "/" });
      if (adminRefresh)
        Cookies.set("refresh_token", adminRefresh, { path: "/" });
      if (adminUser) Cookies.set("user", adminUser, { path: "/" });
      Cookies.remove("admin_access_token", { path: "/" });
      Cookies.remove("admin_refresh_token", { path: "/" });
      Cookies.remove("admin_user", { path: "/" });
      window.location.href = "/admin";
    }
  };

  if (!isAdminImpersonating) return null;

  if (minimized) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={handleReturnToAdmin}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "0.75rem 1.25rem",
            borderRadius: "9999px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 10px 15px -3px rgb(239 68 68 / 0.4)",
          }}
        >
          🛑 Return to Admin
        </button>
        <button
          onClick={() => setMinimized(false)}
          style={{
            background: "white",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          title="Expand Banner"
        >
          ↑
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        background: "#ef4444",
        color: "white",
        zIndex: 9999,
        padding: "0.75rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          fontWeight: 600,
          fontSize: "0.875rem",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <span>⚠️ You are currently using Delegate Access (Impersonating).</span>
        <button
          onClick={handleReturnToAdmin}
          style={{
            background: "white",
            color: "#ef4444",
            border: "none",
            padding: "0.4rem 1rem",
            borderRadius: "6px",
            fontWeight: 800,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Return to Admin Panel
        </button>
      </div>
      <button
        onClick={() => setMinimized(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Minimize"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.8)";
        }}
      >
        ✕
      </button>
    </div>
  );
}
