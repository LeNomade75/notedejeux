import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MEDIA, MEDIA_TYPES, statusLabel, type MediaType } from "@/lib/media";
import { PLATFORMS } from "@/lib/links";
import LinksEditor from "@/components/LinksEditor";
export const dynamic = "force-dynamic";

export default async function Profile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const { id } = await params;
  const { type: rawType } = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { reviews: { orderBy: { createdAt: "desc" }, include: { game: true } }, links: true },
  });
  if (!user) notFound();

  const session = await getServerSession(authOptions);
  const myId = (session?.user as { discordId?: string } | undefined)?.discordId;
  const isMe = !!myId && user.discordId === myId;

  const rs = user.reviews;
  const n = rs.length;
  const done = (s: string) => s === "COMPLETED" || s === "PLATINUM";
  const avg = n ? rs.reduce((s, r) => s + r.rating, 0) / n : null;
  const stats: [string, string][] = [
    ["Avis publiés", String(n)], ["Titres terminés", String(rs.filter((r) => done(r.status)).length)],
    ["Note moyenne donnée", avg ? avg.toFixed(1) : "–"], ["Heures totales", String(rs.reduce((s, r) => s + (r.hoursPlayed ?? 0), 0))],
  ];

  // Statistiques par type de contenu
  const byType = MEDIA_TYPES.map((t) => {
    const list = rs.filter((r) => r.game.mediaType === t);
    return {
      t, n: list.length,
      avg: list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : null,
      finished: list.filter((r) => done(r.status)).length,
      hours: list.reduce((s, r) => s + (r.hoursPlayed ?? 0), 0),
    };
  }).filter((x) => x.n > 0);

  const type = MEDIA_TYPES.includes(rawType as MediaType) ? (rawType as MediaType) : undefined;
  const shown = type ? rs.filter((r) => r.game.mediaType === type) : rs;
  const tab = (active: boolean) => `rounded-full border px-4 py-1.5 text-sm ${active ? "border-violet bg-violet text-white" : "border-line text-muted"}`;
  const links = user.links.flatMap((l) => {
    const p = PLATFORMS.find((x) => x.id === l.platform);
    return p ? [{ ...l, label: p.label }] : [];
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center gap-4">
        {user.image && <img src={user.image} alt="" className="h-20 w-20 rounded-full" />}
        <div className="min-w-0">
          <h1 className="font-display break-words text-3xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted">Sur le site depuis le {user.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </header>

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-violet">
              {l.label} <span className="text-muted">↗</span>
            </a>
          ))}
        </div>
      )}
      {isMe && <LinksEditor initial={user.links.map((l) => ({ platform: l.platform, url: l.url }))} />}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-display text-3xl font-bold text-gold">{value}</div>
            <div className="mt-1 text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>

      {byType.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-2xl font-bold">Statistiques par type</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {byType.map((s) => (
              <div key={s.t} className="rounded-xl border border-line bg-surface p-4">
                <div className="font-display text-lg font-bold">{MEDIA[s.t].plural}</div>
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 text-sm">
                  <dt className="text-muted">Avis</dt><dd className="text-right">{s.n}</dd>
                  <dt className="text-muted">{statusLabel(s.t, "COMPLETED")}s</dt><dd className="text-right">{s.finished}</dd>
                  <dt className="text-muted">Note moyenne</dt><dd className="text-right font-bold text-gold">{s.avg?.toFixed(1)}</dd>
                  <dt className="text-muted">{MEDIA[s.t].hours}</dt><dd className="text-right">{s.hours}</dd>
                </dl>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="font-display mt-10 text-2xl font-bold">Ses avis</h2>
      {byType.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/users/${user.id}`} className={tab(!type)}>Tout</Link>
          {byType.map((s) => <Link key={s.t} href={`/users/${user.id}?type=${s.t}`} className={tab(type === s.t)}>{MEDIA[s.t].plural}</Link>)}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="mt-4 text-muted">Aucun avis pour l'instant.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((r) => (
            <Link key={r.id} href={`/reviews/${r.id}`} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
              {r.game.coverUrl && <img src={r.game.coverUrl} alt="" className="h-24 w-[4.5rem] shrink-0 rounded-md object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{r.game.title}</span>
                  <span className="font-display text-2xl font-bold text-gold">{r.rating}<span className="text-xs text-muted">/10</span></span>
                </div>
                <div className="text-xs text-muted">
                  {MEDIA[r.game.mediaType].label} · {statusLabel(r.game.mediaType, r.status)}{r.hoursPlayed ? ` · ${r.hoursPlayed} h` : ""}
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm text-muted">{r.spoilers ? "Cet avis contient des spoilers." : r.tldr ?? r.body}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
