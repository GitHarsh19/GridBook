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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role>("customer");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setRole(await fetchRole(session.user.id));
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsLoggedIn(true);
          setRole(await fetchRole(session.user.id));
          setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setRole("customer");
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const setLoggedIn = (loggedIn: boolean, newRole?: Role) => {
    setIsLoggedIn(loggedIn);
    if (newRole) setRole(newRole);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setRole("customer");
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
