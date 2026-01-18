"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  profile: UserProfile | null;
}

export function Header({ profile }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const isAdmin = profile?.role === "admin";

  const links = isAdmin
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/reports", label: "Reports" },
      ]
    : [
        { href: "/app", label: "Dashboard" },
        { href: "/app/reports/new", label: "Create Report" },
      ];

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={isAdmin ? "/admin" : "/app"} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
              Shieldify IP
            </p>
            <p className="text-xs text-muted-foreground">Takedown Portal</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                pathname === link.href && "bg-slate-100 text-slate-900"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {profile?.full_name ?? "User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {profile?.email ?? ""}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}
