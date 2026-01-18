import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserProfile } from "@/types/db";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null;

export async function getUserWithProfile(): Promise<{
  user: AuthUser;
  profile: UserProfile | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as UserProfile | null };
  }

  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileData) {
    const fullName =
      typeof (user.user_metadata as Record<string, unknown> | null)?.full_name ===
      "string"
        ? (user.user_metadata as { full_name?: string }).full_name
        : user.email ?? null;

    const { data: created } = await (supabase.from("user_profiles") as any)
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: fullName,
          role: "customer",
        },
        { onConflict: "id" }
      )
      .select("*")
      .maybeSingle();

    return { user, profile: created ?? null };
  }

  return { user, profile: profileData ?? null };
}

export async function requireAuth() {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login");
  }

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireAuth();

  if (profile?.role !== "admin") {
    redirect("/app");
  }

  return { user, profile };
}
