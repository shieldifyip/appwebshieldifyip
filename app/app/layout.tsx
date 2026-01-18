import { Header } from "@/components/layout/header";
import { requireAuth } from "@/lib/auth";

export const metadata = {
  title: "Customer Portal | Shieldify IP",
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
