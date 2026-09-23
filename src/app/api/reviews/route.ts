import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendReviewEmbed } from "@/lib/discord";

const score = z.number().int().min(1).max(10).optional();
const schema = z.object({
  game: z.object({
    igdbId: z.number().int().optional(),
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
  if (!parsed.success) return NextResponse.json({ error: "Formulaire invalide : " + parsed.error.issues.map((i) => `${i.path.join(".")} (${i.message})`).join(", ") }, { status: 400 });
  const { game: g, ...data } = parsed.data;

  const gameData = {
    title: g.title,
    coverUrl: g.coverUrl || null,
    releaseDate: g.releaseDate && !isNaN(Date.parse(g.releaseDate)) ? new Date(g.releaseDate) : null,
    platforms: g.platforms,
    genre: g.genre,
    summary: g.summary,
  };
  const game = g.igdbId
    ? await prisma.game.upsert({ where: { igdbId: g.igdbId }, update: {}, create: { igdbId: g.igdbId, ...gameData } })
    : await prisma.game.create({ data: { ...gameData, custom: true, createdById: user.id } });

  try {
    const review = await prisma.review.create({ data: { ...data, gameId: game.id, userId: user.id } });
    await sendReviewEmbed({ ...review, game, user });
    return NextResponse.json({ id: review.id }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Tu as déjà publié un avis pour ce jeu." }, { status: 409 });
    throw e;
  }
}
