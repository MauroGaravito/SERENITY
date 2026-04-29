import { ADMIN_ROLES, requireUser } from "@/lib/auth";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser(ADMIN_ROLES);
  return children;
}
