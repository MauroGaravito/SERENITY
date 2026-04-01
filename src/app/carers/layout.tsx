import { CARER_ROLES, requireUser } from "@/lib/auth";

export default async function CarersLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser(CARER_ROLES);
  return children;
}

