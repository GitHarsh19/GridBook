import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a server-side Supabase client that reads auth from cookies.
 * Use this in Server Actions and Server Components.
 */
export async function createServerSupabase() {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    );
                } catch {
                    // Can be called from Server Component where cookies can't be set.
                    // This is fine — the middleware will refresh the session.
                }
            },
        },
    });
}

/**
 * Creates a server-side Supabase client for admin operations.
 * Uses a separate cookie storage key to avoid session collision.
 */
export async function createServerSupabaseAdmin() {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    );
                } catch {
                    // Same as above
                }
            },
        },
        auth: {
            storageKey: "sb-admin-auth-token",
        },
    });
}
