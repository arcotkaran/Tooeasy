"use client";

import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/supabase";

export function AccountChip() {
  const { user, configured, loading } = useAuth();

  if (!configured || loading || !user) {
    return <span className="text-[13px] text-muted">Two-minute booking</span>;
  }

  const name =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    user.email ??
    "";
  const first = name.split(" ")[0];

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden text-[13px] text-muted sm:inline">
        {first ? `Hi, ${first}` : "Signed in"}
      </span>
      <button
        onClick={() => signOut()}
        className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-muted transition hover:text-ink"
      >
        Sign out
      </button>
    </div>
  );
}
