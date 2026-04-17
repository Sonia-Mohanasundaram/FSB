import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/services/api";

export type UserRole = "admin" | "doctor" | "patient";

export interface HospitalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialization?: string;
}

interface AuthContextType {
  user: HospitalUser | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole, specialization?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const HospitalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<HospitalUser | null>(() => {
    const saved = localStorage.getItem("hms_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("hms_user", JSON.stringify(user));
    else localStorage.removeItem("hms_user");
  }, [user]);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    if (!email || !password) return false;

    try {
      const response = await authAPI.login(email, password, role);
      const backendUser = response?.user || {};
      const nextUser: HospitalUser = {
        id: backendUser.id || crypto.randomUUID(),
        name: backendUser.name || email.split("@")[0],
        email: backendUser.email || email,
        role: (backendUser.role || role) as UserRole,
        specialization: backendUser.specialization,
      };

      if (response?.token) {
        localStorage.setItem("hms_token", response.token);
      }
      setUser(nextUser);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, specialization?: string): Promise<boolean> => {
    if (!name || !email || !password) return false;

    try {
      const response = await authAPI.register(name, email, password, role, specialization);
      const backendUser = response?.user || {};
      const nextUser: HospitalUser = {
        id: backendUser.id || crypto.randomUUID(),
        name: backendUser.name || name,
        email: backendUser.email || email,
        role: (backendUser.role || role) as UserRole,
        specialization: backendUser.specialization || specialization,
      };

      if (response?.token) {
        localStorage.setItem("hms_token", response.token);
      }
      setUser(nextUser);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useHospitalAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useHospitalAuth must be used within HospitalAuthProvider");
  return ctx;
};
