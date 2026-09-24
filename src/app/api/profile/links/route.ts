import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLATFORMS, validateLink } from "@/lib/links";

const schema = z.object({
  links: z.array(z.object({ platform: z.string().max(30), url: z.string().max(300) })).max(PLATFORMS.length),
});

// Remplace l'ensemble des liens du profil de l'utilisateur connecté
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  if (!discordId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) return NextResponse.json({ error: "Utilisateur inconnu" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const seen = new Set<string>();
  const data: { userId: string; platform: string; url: string }[] = [];
  for (const l of parsed.data.links) {
    if (!l.url.trim()) continue;
    if (seen.has(l.platform)) return NextResponse.json({ error: "Un seul lien par plateforme." }, { status: 400 });
    seen.add(l.platform);
    const v = validateLink(l.platform, l.url);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    data.push({ userId: user.id, platform: l.platform, url: v.url });
  }

  await prisma.$transaction([
    prisma.profileLink.deleteMany({ where: { userId: user.id } }),
    prisma.profileLink.createMany({ data }),
  ]);
  return NextResponse.json({ ok: true });
}
