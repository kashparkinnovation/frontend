"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const StudentContext = createContext(undefined);

const ACTIVE_KEY = "active_student_id";

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [activeStudent, _setActiveStudent] = useState(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);

  // Restore active student from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        _setActiveStudent(parsed);
      } catch {
        localStorage.removeItem(ACTIVE_KEY);
      }
    }
  }, []);

  // When students list loads, sync the active student (it may have been updated)
  useEffect(() => {
    if (students.length > 0 && activeStudent) {
      const updated = students.find((s) => s.id === activeStudent.id);
      if (updated) _setActiveStudent(updated);
    }
    // Auto-select first if none selected
    if (students.length > 0 && !activeStudent) {
      const stored = localStorage.getItem(ACTIVE_KEY);
      if (!stored) setActiveStudent(students[0]);
    }
  }, [students]);

  const setActiveStudent = (s) => {
    _setActiveStudent(s);
    if (s) localStorage.setItem(ACTIVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(ACTIVE_KEY);
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
