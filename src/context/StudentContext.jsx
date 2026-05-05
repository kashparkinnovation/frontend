"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const StudentContext = createContext(undefined);

// Store only the ID to avoid stale cached data
const ACTIVE_KEY = "active_student_id";

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);

  // Restore active student ID from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_KEY);
    if (stored) {
      const id = parseInt(stored, 10);
      if (!isNaN(id)) setActiveStudentId(id);
    }
  }, []);

  // Auto-select first student if none is selected after students load
  useEffect(() => {
    if (students.length > 0 && activeStudentId === null) {
      const stored = localStorage.getItem(ACTIVE_KEY);
      if (!stored) {
        setActiveStudentId(students[0].id);
        localStorage.setItem(ACTIVE_KEY, String(students[0].id));
      }
    }
  }, [students, activeStudentId]);

  /**
   * Always resolve the active student from the live `students` list.
   * This ensures is_verified and other fields are always up-to-date.
   */
  const activeStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) ?? null,
    [students, activeStudentId],
  );

  const setActiveStudent = (s) => {
    if (s) {
      setActiveStudentId(s.id);
      localStorage.setItem(ACTIVE_KEY, String(s.id));
    } else {
      setActiveStudentId(null);
      localStorage.removeItem(ACTIVE_KEY);
    }
  };

  const triggerRefresh = () => setRefreshNeeded((v) => !v);

  return (
    <StudentContext.Provider
      value={{
        students,
        activeStudent,
        setActiveStudent,
        setStudents,
        refreshNeeded,
        triggerRefresh,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used inside <StudentProvider>");
  return ctx;
}
