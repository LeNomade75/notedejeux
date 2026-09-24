import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchGames } from "@/lib/igdb";
import { searchTmdb } from "@/lib/tmdb";
import { searchAnime } from "@/lib/anilist";
import { MEDIA_TYPES, type MediaType } from "@/lib/media";

export async function GET(req: Request) {
  if (!(await getServerSession(authOptions))) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const type = (sp.get("type") ?? "GAME") as MediaType;
  if (!MEDIA_TYPES.includes(type)) return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  if (!q) return NextResponse.json([]);

  let external: unknown[] = [];
  let externalError: string | null = null;
  try {
    if (type === "GAME") external = (await searchGames(q)).map((g: object) => ({ ...g, mediaType: "GAME" }));
    else if (type === "ANIME") external = await searchAnime(q);
    else external = await searchTmdb(q, type);
  } catch (e: any) {
    console.error("[search]", e);
    externalError = e.message;
  }

  // Titres sur mesure déjà créés : affichés en premier pour éviter les doublons
  const found = await prisma.game.findMany({
    where: { custom: true, mediaType: type, title: { contains: q, mode: "insensitive" } },
    take: 6,
  });
  const custom = found.map((g) => ({
    id: g.id, custom: true, mediaType: g.mediaType, title: g.title, coverUrl: g.coverUrl ?? undefined,
    releaseDate: g.releaseDate?.toISOString(), platforms: g.platforms,
    genre: g.genre ?? undefined, summary: g.summary ?? undefined,
  }));

  if (externalError && custom.length === 0) return NextResponse.json({ error: externalError }, { status: 500 });
  return NextResponse.json([...custom, ...external]);
}
