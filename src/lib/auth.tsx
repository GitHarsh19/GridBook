"use client";

import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

type Role = "customer" | "admin";

interface AuthState {
    isLoggedIn: boolean;
    role: Role;
    setLoggedIn: (loggedIn: boolean, role?: Role) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<Role>("customer");

    const setLoggedIn = (loggedIn: boolean, newRole?: Role) => {
        setIsLoggedIn(loggedIn);
        if (newRole) setRole(newRole);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setRole("customer");
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, role, setLoggedIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
