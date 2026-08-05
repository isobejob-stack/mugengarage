import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler / Server Action から呼び出すSupabaseクライアント。
// Next.js 16ではcookies()が非同期のため、生成側の関数も非同期にしている。
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Componentからの呼び出し時はset不可（proxy.tsがセッション更新を担う）
          }
        },
      },
    },
  );
}
