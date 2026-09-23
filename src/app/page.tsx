import Link from "next/link";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; min?: string }> }) {
  const { q, min } = await searchParams;
  const where = {
    ...(q ? { OR: [
      { game: { title: { contains: q, mode: "insensitive" as const } } },
      { user: { name: { contains: q, mode: "insensitive" as const } } },
    ] } : {}),
    ...(min ? { rating: { gte: Number(min) } } : {}),
  };
  const [reviews, top] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, take: 18, include: { game: true, user: true } }),
    prisma.review.groupBy({ by: ["gameId"], _avg: { rating: true }, _count: { _all: true }, orderBy: { _avg: { rating: "desc" } }, take: 5 }),
  ]);
  const games = await prisma.game.findMany({ where: { id: { in: top.map((t) => t.gameId) } } });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <section>
        <form className="mb-6 flex gap-2">
          <input name="q" defaultValue={q} placeholder="Jeu ou auteur" className="flex-1 rounded-lg border border-line bg-surface px-3 py-2" />
          <select name="min" defaultValue={min ?? ""} className="rounded-lg border border-line bg-surface px-2">
            <option value="">Toutes notes</option>
            {[6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}/10 et +</option>)}
          </select>
          <button className="rounded-lg bg-violet px-4 font-medium">Filtrer</button>
        </form>
        {reviews.length === 0 && <p className="text-muted">Aucun avis pour l'instant. Écris le premier.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <Link key={r.id} href={`/reviews/${r.id}`} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
              {r.game.coverUrl && <img src={r.game.coverUrl} alt="" className="h-28 w-20 rounded-md object-cover" />}
              <div className="min-w-0">
                <div className="font-display text-3xl font-bold text-gold">{r.rating}<span className="text-sm text-muted">/10</span></div>
                <div className="truncate font-medium">{r.game.title}</div>
                <p className="line-clamp-2 text-sm text-muted">{r.spoilers ? "Contient des spoilers" : r.tldr ?? r.body}</p>
                <div className="mt-1 text-xs text-muted">par {r.user.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <aside>
        <h2 className="font-display mb-3 text-lg font-bold">Les mieux notés</h2>
        <ol className="space-y-2">
          {top.map((t) => {
            const g = games.find((x) => x.id === t.gameId);
            return (
              <li key={t.gameId} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <span className="truncate">{g?.title}</span>
                <span className="font-bold text-gold">{t._avg.rating?.toFixed(1)}</span>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
