import { redirect } from "next/navigation";

import { getUserWithProfile } from "@/lib/auth";

export default async function Home() {
  const { user, profile } = await getUserWithProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  redirect("/app");
}
