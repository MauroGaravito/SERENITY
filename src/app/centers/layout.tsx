import { CENTER_ROLES, requireUser } from "@/lib/auth";

export default async function CentersLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser(CENTER_ROLES);
  return children;
}

