import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const score = z.number().int().min(1).max(10).nullable().optional();
const schema = z.object({
  rating: z.number().int().min(1).max(10),
  graphics: score, gameplay: score, story: score, soundtrack: score,
  customRatings: z.array(z.object({ label: z.string().trim().min(1).max(30), value: z.number().int().min(1).max(10) })).max(6).default([]),
  status: z.enum(["COMPLETED", "IN_PROGRESS", "DROPPED", "PLATINUM"]),
  hoursPlayed: z.number().int().min(0).max(100000).nullable().optional(),
  tldr: z.string().max(400).nullable().optional(),
  body: z.string().min(50).max(20000),
  pros: z.array(z.string().max(120)).max(8).default([]),
  cons: z.array(z.string().max(120)).max(8).default([]),
  spoilers: z.boolean(),
});

// Vérifie que l'utilisateur connecté est bien l'auteur de l'avis
async function authorize(id: string) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  if (!discordId) return { error: NextResponse.json({ error: "Non connecté" }, { status: 401 }) };
  const review = await prisma.review.findUnique({ where: { id }, include: { user: true } });
  if (!review) return { error: NextResponse.json({ error: "Avis introuvable" }, { status: 404 }) };
  if (review.user.discordId !== discordId) return { error: NextResponse.json({ error: "Ce n'est pas ton avis" }, { status: 403 }) };
  return { review };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire invalide : " + parsed.error.issues.map((i) => `${i.path.join(".")} (${i.message})`).join(", ") }, { status: 400 });
  }
  await prisma.review.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ id });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
