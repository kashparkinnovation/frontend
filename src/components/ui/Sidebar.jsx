"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

export default function Sidebar({ navItems, portalTitle }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  // Start collapsed on mobile, open on desktop
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = (e) => {
      setIsMobile(e.matches);
      setCollapsed(e.matches); // auto-collapse on mobile
    };
    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [pathname, isMobile]);

  const isOpen = !collapsed;

  return (
    <>
      {/* Mobile hamburger — always visible on mobile when sidebar is closed */}
      {isMobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className={styles.mobileToggleBtn}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}

      {/* Overlay to close sidebar on mobile tap outside */}
      {isMobile && isOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>🎓</span>
          {isOpen && (
            <span className={styles.portalTitle}>{portalTitle}</span>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            {isOpen ? "←" : "→"}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {isOpen && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {isOpen && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </div>
              <div>
                <p className={styles.userName}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p className={styles.userRole}>{user?.role}</p>
              </div>
            </div>
          )}
          <button onClick={logout} className={styles.logoutBtn} title="Logout">
            🚪 {isOpen && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
