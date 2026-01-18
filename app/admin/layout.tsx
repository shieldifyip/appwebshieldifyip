import { Header } from "@/components/layout/header";
import { requireAdmin } from "@/lib/auth";

export const metadata = {
  title: "Admin Portal | Shieldify IP",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
