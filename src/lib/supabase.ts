import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * In-memory mutex lock that replaces navigator.locks.
 * Serializes operations properly (unlike a no-op) while avoiding
 * the orphaned-lock issue that navigator.locks has with React Strict Mode.
 */
const inMemoryLock = (() => {
  const locks = new Map<string, Promise<void>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
    // Wait for any previous holder of this lock to finish
    const prev = locks.get(_name);
    if (prev) {
      await prev.catch(() => {});
    }

    // Create a gate that the next caller will wait on
    let release: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    locks.set(_name, gate);

    try {
      return await fn();
    } finally {
      release!();
      // Clean up only if we're still the current holder
      if (locks.get(_name) === gate) {
        locks.delete(_name);
      }
    }
  };
})();

/** Customer Supabase client — default storage key.
 *  detectSessionInUrl is OFF; the callback page manually sets the session
 *  on the correct client so admin OAuth never pollutes the customer key. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    autoRefreshToken: true,
    persistSession: true,
    lock: inMemoryLock,
  },
});

/** Admin Supabase client — separate storage key so sessions don't collide. */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "sb-admin-auth-token",
    detectSessionInUrl: false,
    autoRefreshToken: true,
    persistSession: true,
    lock: inMemoryLock,
  },
});
