"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

type Role = "customer" | "admin";

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  role: Role;
  setLoggedIn: (loggedIn: boolean, role?: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchRole(userId: string): Promise<Role> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (error) return "customer";
    return data?.role === "admin" ? "admin" : "customer";
  } catch {
    return "customer";
  }
}

const DEMO_AUTH_KEY = "gridbook_demo_auth";

function saveDemoAuth(role: Role) {
  localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ role }));
}

function loadDemoAuth(): Role | null {
  try {
    const raw = localStorage.getItem(DEMO_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.role === "admin" ? "admin" : "customer";
  } catch {
    localStorage.removeItem(DEMO_AUTH_KEY);
    return null;
  }
}

function clearDemoAuth() {
  localStorage.removeItem(DEMO_AUTH_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role>("customer");

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (session) {
            setIsLoggedIn(true);
            setRole(await fetchRole(session.user.id));
            clearDemoAuth();
          } else if (event === "INITIAL_SESSION") {
            // No Supabase session — check for persisted demo login
            const demoRole = loadDemoAuth();
            if (demoRole) {
              setIsLoggedIn(true);
              setRole(demoRole);
            }
          }
          setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setRole("customer");
          clearDemoAuth();
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setLoggedIn = (loggedIn: boolean, newRole?: Role) => {
    setIsLoggedIn(loggedIn);
    if (newRole) setRole(newRole);
    // Persist demo login so it survives page refresh
    if (loggedIn && newRole) {
      saveDemoAuth(newRole);
    } else if (!loggedIn) {
      clearDemoAuth();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setRole("customer");
    clearDemoAuth();
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, role, setLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
