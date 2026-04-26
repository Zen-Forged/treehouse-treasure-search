import type { ErrorEvent } from "@sentry/nextjs";

// Defense-in-depth on top of `sendDefaultPii: false`. Strips user identifiers,
// request bodies, cookies, and auth headers before any event leaves the
// process. Update this list when a new sensitive key surfaces (Supabase
// service-role tokens, vendor emails in post bodies, etc.).
export function scrubPii(event: ErrorEvent): ErrorEvent {
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      delete event.request.headers["cookie"];
      delete event.request.headers["authorization"];
      delete event.request.headers["x-supabase-auth"];
    }
  }
  return event;
}
