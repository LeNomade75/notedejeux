import Link from "next/link";
import { prisma } from "@/lib/db";
import { MEDIA, MEDIA_TYPES, type MediaType } from "@/lib/media";
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; min?: string; type?: string }> }) {
  const { q, min, type: rawType } = await searchParams;
  const type = MEDIA_TYPES.includes(rawType as MediaType) ? (rawType as MediaType) : undefined;
  const byType = type ? { game: { mediaType: type } } : {};
  const where = {
    ...byType,
    ...(q ? { OR: [
      { game: { title: { contains: q, mode: "insensitive" as const } } },
      { user: { name: { contains: q, mode: "insensitive" as const } } },
    ] } : {}),
    ...(min ? { rating: { gte: Number(min) } } : {}),
  };
  const [reviews, topRaw] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, take: 18, include: { game: true, user: true } }),
    prisma.review.groupBy({ by: ["gameId"], where: byType, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  // Classement : moyenne (arrondie comme à l'affichage), puis nombre d'avis en cas d'égalité
  const round = (n: number | null) => Math.round((n ?? 0) * 10) / 10;
  const top = topRaw
    .sort((a, b) => round(b._avg.rating) - round(a._avg.rating) || b._count._all - a._count._all)
    .slice(0, 5);
  const games = await prisma.game.findMany({ where: { id: { in: top.map((t) => t.gameId) } } });
  const tab = (active: boolean) => `rounded-full border px-4 py-1.5 text-sm ${active ? "border-violet bg-violet text-white" : "border-line text-muted"}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <section>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/" className={tab(!type)}>Tout</Link>
          {MEDIA_TYPES.map((t) => <Link key={t} href={`/?type=${t}`} className={tab(type === t)}>{MEDIA[t].plural}</Link>)}
        </div>
        <form className="mb-6 flex gap-2">
          <input type="hidden" name="type" value={type ?? ""} />
          <input name="q" defaultValue={q} placeholder="Titre ou auteur" className="flex-1 rounded-lg border border-line bg-surface px-3 py-2" />
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
                <div className="text-xs text-muted">{MEDIA[r.game.mediaType].label}</div>
                <p className="line-clamp-2 text-sm text-muted">{r.spoilers ? "Contient des spoilers" : r.tldr ?? r.body}</p>
                <div className="mt-1 text-xs text-muted">par {r.user.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <aside>
        <h2 className="font-display mb-3 text-lg font-bold">Les mieux notés{type ? ` · ${MEDIA[type].plural}` : ""}</h2>
        <ol className="space-y-2">
          {top.map((t) => {
            const g = games.find((x) => x.id === t.gameId);
            return (
              <li key={t.gameId} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <span className="truncate">{g?.title}</span>
                <span className="shrink-0">
                  <b className="text-gold">{t._avg.rating?.toFixed(1)}</b>
                  <span className="text-xs text-muted"> · {t._count._all} avis</span>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
