import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MyProfile() {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  if (!discordId) redirect("/");
  const user = await prisma.user.findUnique({ where: { discordId } });
  redirect(user ? `/users/${user.id}` : "/");
}
