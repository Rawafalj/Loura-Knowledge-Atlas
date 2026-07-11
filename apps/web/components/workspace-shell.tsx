import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@loura/ui";

import type { WorkspaceMembership } from "@/lib/auth/session";
import { signOut } from "@/app/atlas/actions";

import { CommandPalette } from "./search/command-palette";

const primaryNavigation = [
  { href: "/atlas", label: "World map" },
  { href: "/atlas#domains", label: "Domains" },
  { href: "/atlas#concepts", label: "Concepts" },
];

export function WorkspaceShell({
  membership,
  userEmail,
  children,
}: {
  membership: WorkspaceMembership;
  userEmail: string | null;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link
          href="/atlas"
          className="brand-mark"
          aria-label="Loura Knowledge Atlas home"
        >
          <span className="brand-mark__monogram" aria-hidden="true">
            L
          </span>
          <span>
            <strong>Loura</strong>
            <small>Knowledge Atlas</small>
          </span>
        </Link>
        <nav aria-label="Atlas navigation">
          <p className="nav-label">Atlas</p>
          {primaryNavigation.map((item) => (
            <Link href={item.href} key={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
          <p className="nav-label">Later milestones</p>
          <span className="nav-link nav-link--disabled">Learning paths</span>
          <span className="nav-link nav-link--disabled">Sources</span>
          <span className="nav-link nav-link--disabled">Ask Atlas</span>
        </nav>
        <div className="sidebar-footer">
          <Badge tone="accent">{membership.role}</Badge>
          <span>{userEmail ?? "Authenticated user"}</span>
          <form action={signOut}>
            <button className="text-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="app-frame">
        <header className="utility-bar">
          <div>
            <strong>{membership.workspace.name}</strong>
            <span>Private workspace</span>
          </div>
          <CommandPalette workspaceId={membership.workspaceId} />
        </header>
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}
