import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendReviewEmbed } from "@/lib/discord";

const score = z.number().int().min(1).max(10).optional();
const schema = z.object({
  game: z.object({
    id: z.string().optional(),
    mediaType: z.enum(["GAME", "MOVIE", "SERIES", "ANIME"]).default("GAME"),
    igdbId: z.number().int().optional(),
    tmdbId: z.number().int().optional(),
    anilistId: z.number().int().optional(),
    title: z.string().min(1).max(200),
    coverUrl: z.string().url().optional().or(z.literal("")),
    releaseDate: z.string().optional(),
    platforms: z.array(z.string()).default([]),
    genre: z.string().max(60).optional(),
    summary: z.string().max(1000).optional(),
  }),
  rating: z.number().int().min(1).max(10),
  graphics: score, gameplay: score, story: score, soundtrack: score,
  customRatings: z.array(z.object({ label: z.string().trim().min(1).max(30), value: z.number().int().min(1).max(10) })).max(6).default([]),
  status: z.enum(["COMPLETED", "IN_PROGRESS", "DROPPED", "PLATINUM"]),
  hoursPlayed: z.number().int().min(0).max(100000).optional(),
  tldr: z.string().max(400).optional(),
  body: z.string().min(50).max(20000),
  pros: z.array(z.string().max(120)).max(8).default([]),
  cons: z.array(z.string().max(120)).max(8).default([]),
  spoilers: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  if (!discordId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) return NextResponse.json({ error: "Utilisateur inconnu" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire invalide : " + parsed.error.issues.map((i) => `${i.path.join(".")} (${i.message})`).join(", ") }, { status: 400 });
  }
  const { game: g, ...data } = parsed.data;
  const type = g.mediaType;

  const gameData = {
    title: g.title,
    coverUrl: g.coverUrl || null,
    releaseDate: g.releaseDate && !isNaN(Date.parse(g.releaseDate)) ? new Date(g.releaseDate) : null,
    platforms: g.platforms,
    genre: g.genre,
    summary: g.summary,
  };

  let game;
  if (g.id) {
    game = await prisma.game.findUnique({ where: { id: g.id } });
  } else if (g.igdbId) {
    game = await prisma.game.upsert({ where: { igdbId: g.igdbId }, update: {}, create: { ...gameData, mediaType: "GAME", igdbId: g.igdbId } });
  } else if (g.tmdbId && (type === "MOVIE" || type === "SERIES")) {
    game = await prisma.game.upsert({
      where: { mediaType_tmdbId: { mediaType: type, tmdbId: g.tmdbId } },
      update: {},
      create: { ...gameData, mediaType: type, tmdbId: g.tmdbId },
    });
  } else if (g.anilistId) {
    game = await prisma.game.upsert({ where: { anilistId: g.anilistId }, update: {}, create: { ...gameData, mediaType: "ANIME", anilistId: g.anilistId } });
  } else {
    // Titre sur mesure : on réutilise celui qui existe déjà (même type, même titre)
    game =
      (await prisma.game.findFirst({ where: { custom: true, mediaType: type, title: { equals: g.title.trim(), mode: "insensitive" } } })) ??
      (await prisma.game.create({ data: { ...gameData, mediaType: type, custom: true, createdById: user.id } }));
  }
  if (!game) return NextResponse.json({ error: "Titre introuvable" }, { status: 404 });

  try {
    const review = await prisma.review.create({ data: { ...data, gameId: game.id, userId: user.id } });
    await sendReviewEmbed({ ...review, game, user });
    return NextResponse.json({ id: review.id }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Tu as déjà publié un avis pour ce titre." }, { status: 409 });
    throw e;
  }
}
