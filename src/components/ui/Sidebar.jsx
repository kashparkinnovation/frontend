"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

export default function Sidebar({ navItems, portalTitle }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>🎓</span>
          {!collapsed && (
            <span className={styles.portalTitle}>{portalTitle}</span>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? "→" : "←"}
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
                {!collapsed && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {!collapsed && (
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
            🚪 {!collapsed && "Logout"}
          </button>
        </div>
      </aside>
      {/* Mobile overlay toggle */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className={styles.mobileToggleBtn}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}
    </>
  );
}
