import { CarerWorkspace } from "@/components/carers/carer-workspace";
import { CARER_ROLES, requireUser } from "@/lib/auth";
import { getCarerWorkspace } from "@/lib/carers-data";

export const dynamic = "force-dynamic";

export default async function CarerAvailabilityPage() {
  const session = await requireUser(CARER_ROLES);
  const workspace = await getCarerWorkspace(session.userId);

  if (!workspace) {
    return (
      <main className="role-page carer-theme">
        <section>
          <span className="eyebrow">Carer execution</span>
          <h1>No active carer workspace found</h1>
          <p>The logged in user is not linked to an active carer profile.</p>
        </section>
      </main>
    );
  }

  return <CarerWorkspace currentSection="availability" session={session} workspace={workspace} />;
}
