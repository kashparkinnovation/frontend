'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface StudentProfile {
  id: number;
  student_name: string;
  class_name: string;
  section: string;
  roll_number: string;
  student_id: string;
  school: number;
  school_name: string;
  is_verified: boolean;
  verified_at: string | null;
}

interface StudentContextValue {
  students: StudentProfile[];
  activeStudent: StudentProfile | null;
  setActiveStudent: (s: StudentProfile | null) => void;
  setStudents: (s: StudentProfile[]) => void;
  refreshNeeded: boolean;
  triggerRefresh: () => void;
}

const StudentContext = createContext<StudentContextValue | undefined>(undefined);

const ACTIVE_KEY = 'active_student_id';

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, _setActiveStudent] = useState<StudentProfile | null>(null);
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

  const setActiveStudent = (s: StudentProfile | null) => {
    _setActiveStudent(s);
    if (s) localStorage.setItem(ACTIVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(ACTIVE_KEY);
  };

  const triggerRefresh = () => setRefreshNeeded((v) => !v);

  return (
    <StudentContext.Provider value={{ students, activeStudent, setActiveStudent, setStudents, refreshNeeded, triggerRefresh }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent(): StudentContextValue {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside <StudentProvider>');
  return ctx;
}
