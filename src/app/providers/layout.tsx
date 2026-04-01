import { PROVIDER_ROLES, requireUser } from "@/lib/auth";

export default async function ProvidersLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser(PROVIDER_ROLES);
  return children;
}

