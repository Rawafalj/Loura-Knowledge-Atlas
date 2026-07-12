import { redirect } from "next/navigation";

import { requireWorkspaceMembership } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireWorkspaceMembership();
  redirect("/atlas");
}
