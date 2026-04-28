import { notFound } from "next/navigation";
import { CarerWorkspace } from "@/components/carers/carer-workspace";
import { CARER_ROLES, requireUser } from "@/lib/auth";
import { getCarerWorkspace } from "@/lib/carers-data";

export const dynamic = "force-dynamic";

export default async function CarerVisitExecutionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser(CARER_ROLES);
  const workspace = await getCarerWorkspace(session.userId);
  const { id } = await params;

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

  if (!workspace.visits.some((visit) => visit.id === id)) {
    notFound();
  }

  return (
    <CarerWorkspace
      currentSection="visit"
      selectedVisitId={id}
      session={session}
      workspace={workspace}
    />
  );
}
