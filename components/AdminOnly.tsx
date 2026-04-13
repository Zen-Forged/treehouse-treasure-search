// components/AdminOnly.tsx
// Wrapper that renders children only when the current user is an admin.
// Use this to wrap every admin-only UI element so the codebase has a clear
// audit trail of where admin controls live.
//
// Usage:
//   <AdminOnly user={user}>
//     <button>Delete booth</button>
//   </AdminOnly>

"use client";

import { isAdmin } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

interface AdminOnlyProps {
  user: User | null;
  children: React.ReactNode;
}

export default function AdminOnly({ user, children }: AdminOnlyProps) {
  if (!user || !isAdmin(user)) return null;
  return <>{children}</>;
}
