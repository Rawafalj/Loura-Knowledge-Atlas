import { requireWorkspaceMembership } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function WorkspaceHomePage() {
  await requireWorkspaceMembership();
  redirect("/atlas");
}
