import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession(authOptions))) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await params;
  const g = await prisma.game.findUnique({ where: { id } });
  if (!g) return NextResponse.json({ error: "Titre introuvable" }, { status: 404 });
  return NextResponse.json({
    mediaType: g.mediaType, title: g.title, coverUrl: g.coverUrl ?? undefined,
    releaseDate: g.releaseDate?.toISOString(), platforms: g.platforms,
    genre: g.genre ?? undefined, summary: g.summary ?? undefined,
  });
}
