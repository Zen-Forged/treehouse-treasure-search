import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// Wrapped via wrapRouteHandlerWithSentry — required on Next.js 14.x for
// App Router route handlers to surface throws to Sentry. Next.js 15+ does
// this automatically via the onRequestError hook in instrumentation.ts.
export const GET = Sentry.wrapRouteHandlerWithSentry(
  async () => {
    Sentry.logger.info("Sentry example API called");
    throw new SentryExampleAPIError(
      "This error is raised on the backend called by the example page.",
    );
  },
  {
    method: "GET",
    parameterizedRoute: "/api/sentry-example-api",
  },
);
