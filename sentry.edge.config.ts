// Sentry edge-runtime init. Loaded from instrumentation.ts when NEXT_RUNTIME === "edge".
// Note: this is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: "https://398cc57ce213aacc007f4632fbfc4259@o4511286906322944.ingest.us.sentry.io/4511286908878848",
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
  beforeSend: scrubPii,
});
