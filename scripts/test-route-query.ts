import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const path = resolve(process.cwd(), ".env.local");
const env: Record<string, string> = {};
for (const line of readFileSync(path, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  let v = t.slice(i+1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1);
  env[t.slice(0,i).trim()] = v;
}

(async () => {
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error, count } = await c
    .from("events")
    .select("id, event_type, user_id, session_id, payload, occurred_at", { count: "exact" })
    .order("occurred_at", { ascending: false })
    .limit(50);

  console.log("error:", error?.message ?? "none");
  console.log("count (total):", count);
  console.log("rows returned:", data?.length ?? 0);
  if (data?.length) {
    console.log("first:", data[0]!.occurred_at, data[0]!.event_type);
    console.log("last :", data[data.length-1]!.occurred_at, data[data.length-1]!.event_type);
  }
})();
