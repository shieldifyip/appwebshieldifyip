import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register disabled | Shieldify IP",
};

export default function RegisterPage() {
  redirect("/login");
}
