import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | Shieldify IP",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
        <div className="space-y-1 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-200">
            Shieldify IP
          </p>
          <h1 className="text-2xl font-semibold">Takedown Portal</h1>
          <p className="text-sm text-slate-200">
            Sign in to manage your reports securely.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-slate-200">
          Don&apos;t have an account? Please contact admin to be provisioned.
        </p>
      </div>
    </div>
  );
}
