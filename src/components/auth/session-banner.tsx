import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { getHomeForRole, getRoleLabel, type SessionUser } from "@/lib/auth";

export function SessionBanner({ session }: { session: SessionUser }) {
  return (
    <div className="session-banner">
      <div className="session-banner-info">
        <span className="eyebrow">Active session</span>
        <strong>{session.fullName}</strong>
        <p>
          {getRoleLabel(session.role)} · {session.email}
        </p>
      </div>
      <div className="session-banner-actions">
        <Link className="ghost-link" href={getHomeForRole(session.role)}>
          Open workspace
        </Link>
        <form action={logoutAction}>
          <button className="ghost-link logout-button" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

