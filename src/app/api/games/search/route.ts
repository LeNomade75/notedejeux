import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchGames } from "@/lib/igdb";

export async function GET(req: Request) {
  if (!(await getServerSession(authOptions))) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  try {
    return NextResponse.json(q ? await searchGames(q) : []);
  } catch (e: any) {
    console.error("[igdb]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}