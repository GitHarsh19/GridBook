"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase, supabaseAdmin } from "@/lib/supabase";

type Role = "customer" | "admin";

interface AuthState {
  /** Customer is logged in (Supabase or demo) */
  isLoggedIn: boolean;
  /** Admin is logged in (independent from customer) */
  isAdmin: boolean;
  isLoading: boolean;
  role: Role;
  setLoggedIn: (loggedIn: boolean, role?: Role) => void;
  logout: (role?: Role) => void;
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

/* ─── Separate storage for admin vs customer demo auth ─────────────── */

const ADMIN_AUTH_KEY = "gridbook_admin_auth";
const CUSTOMER_DEMO_KEY = "gridbook_demo_auth";

function saveAdminAuth() {
  localStorage.setItem(ADMIN_AUTH_KEY, "true");
}
function loadAdminAuth(): boolean {
  return localStorage.getItem(ADMIN_AUTH_KEY) === "true";
}
function clearAdminAuth() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
}

function saveCustomerDemo() {
  localStorage.setItem(CUSTOMER_DEMO_KEY, "true");
}
function loadCustomerDemo(): boolean {
  return localStorage.getItem(CUSTOMER_DEMO_KEY) === "true";
}
function clearCustomerDemo() {
  localStorage.removeItem(CUSTOMER_DEMO_KEY);
}

/* ─── Provider ─────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // customer
  const [isAdmin, setIsAdmin] = useState(false);        // admin (independent)
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role>("customer");

  useEffect(() => {
    let mounted = true;

    // Restore admin session from localStorage or supabaseAdmin session
    if (loadAdminAuth()) {
      setIsAdmin(true);
    }

    // Listen to CUSTOMER auth state (supabase client)
    const { data: { subscription: customerSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (session) {
            setRole("customer");
            setIsLoggedIn(true);
            clearCustomerDemo();
          } else if (event === "INITIAL_SESSION") {
            if (loadCustomerDemo()) {
              setIsLoggedIn(true);
              setRole("customer");
            }
          }
          setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setRole("customer");
          setIsLoading(false);
        }
      }
    );

    // Listen to ADMIN auth state (supabaseAdmin client)
    const { data: { subscription: adminSub } } = supabaseAdmin.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (session) {
            setIsAdmin(true);
            saveAdminAuth();
          }
        } else if (event === "SIGNED_OUT") {
          setIsAdmin(false);
          clearAdminAuth();
        }
      }
    );

    return () => {
      mounted = false;
      customerSub.unsubscribe();
      adminSub.unsubscribe();
    };
  }, []);

  const setLoggedIn = (loggedIn: boolean, newRole?: Role) => {
    if (newRole === "admin") {
      setIsAdmin(loggedIn);
      if (loggedIn) saveAdminAuth();
      else clearAdminAuth();
    } else {
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        setRole("customer");
        saveCustomerDemo();
      } else {
        setRole("customer");
        clearCustomerDemo();
      }
    }
  };

  const logout = async (logoutRole?: Role) => {
    if (logoutRole === "admin") {
      clearAdminAuth();
      setIsAdmin(false);
      await supabaseAdmin.auth.signOut();
    } else if (logoutRole === "customer") {
      clearCustomerDemo();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setRole("customer");
    } else {
      // Logout all
      clearAdminAuth();
      clearCustomerDemo();
      await supabaseAdmin.auth.signOut();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setIsAdmin(false);
      setRole("customer");
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isAdmin, isLoading, role, setLoggedIn, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
