// app/scan/page.tsx
// Legacy route — home screen moved to app/page.tsx (/).
// Redirect anyone who lands here so old links don't 404.
import { redirect } from "next/navigation";

export default function ScanRedirect() {
  redirect("/");
}
