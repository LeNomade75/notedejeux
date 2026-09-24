import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReviewActions from "@/components/ReviewActions";
import { MEDIA, statusLabel } from "@/lib/media";
import { youtubeUrl } from "@/lib/youtube";

const chip = "rounded-full border border-line bg-night/60 px-3 py-1 text-xs text-muted";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.review.findUnique({ where: { id }, include: { game: true, user: true } });
  if (!r) notFound();

  const [others, agg, session] = await Promise.all([
    prisma.review.findMany({ where: { gameId: r.gameId, NOT: { id: r.id } }, orderBy: { createdAt: "desc" }, include: { user: true } }),
    prisma.review.aggregate({ where: { gameId: r.gameId }, _avg: { rating: true }, _count: { _all: true } }),
    getServerSession(authOptions),
  ]);
  const t = r.game.mediaType;
  const m = MEDIA[t];
  const myId = (session?.user as { discordId?: string } | undefined)?.discordId;
  const isAuthor = !!myId && r.user.discordId === myId;
  const hasMine = !!myId && (isAuthor || others.some((o) => o.user.discordId === myId));
  const avg = agg._avg.rating ?? r.rating;
  const count = agg._count._all;

  const custom = (r.customRatings as { label: string; value: number }[] | null) ?? [];
  const sub: [string, number][] = [
    ...m.subs.filter(([k]) => r[k] != null).map(([k, label]) => [label, r[k] as number] as [string, number]),
    ...custom.map((c) => [c.label, c.value] as [string, number]),
  ];
  const meta = [m.label, r.game.channel ?? r.game.genre, r.game.releaseDate?.getFullYear(), r.game.platforms.slice(0, 4).join(", ")].filter(Boolean).join(" · ");
  const article = <div className="review-body"><Markdown>{r.body}</Markdown></div>;

  return (
    <article className="mx-auto max-w-3xl">
      <header className="relative overflow-hidden rounded-2xl border border-line">
        {r.game.coverUrl && (
          <div aria-hidden className="absolute inset-0 scale-125 bg-cover bg-center opacity-25 blur-2xl" style={{ backgroundImage: `url(${r.game.coverUrl})` }} />
        )}
        <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-end">
          {r.game.coverUrl && <img src={r.game.coverUrl} alt="" className={`shrink-0 rounded-xl shadow-2xl ${r.game.youtubeId ? "w-56" : "w-36"}`} />}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-display break-words text-3xl font-bold sm:text-4xl">{r.game.title}</h1>
            {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
            {r.game.youtubeId && (
              <a href={youtubeUrl(r.game.youtubeId)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-gold underline">
                Regarder la vidéo sur YouTube ↗
              </a>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm sm:justify-start">
              {r.user.image && <img src={r.user.image} alt="" className="h-7 w-7 rounded-full" />}
              <Link href={`/users/${r.user.id}`} className="font-medium hover:text-gold">{r.user.name}</Link>
              <span className="text-muted">le {r.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className={chip}>{statusLabel(t, r.status)}</span>
              {r.hoursPlayed ? <span className={chip}>{r.hoursPlayed} h {m.hoursSuffix}</span> : null}
              {r.spoilers && <span className={`${chip} text-gold`}>Spoilers</span>}
            </div>
          </div>
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-2 border-gold bg-night/60">
            <span className="font-display text-4xl font-bold leading-none text-gold">{r.rating}</span>
            <span className="text-xs text-muted">sur 10</span>
          </div>
        </div>
      </header>

      {isAuthor && <ReviewActions id={r.id} />}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-3">
        <span className="text-sm text-muted">Note globale de la communauté</span>
        <span>
          <b className="font-display text-2xl text-gold">{avg.toFixed(1)}</b>
          <span className="text-muted"> /10 · {count} avis</span>
        </span>
      </div>

      {sub.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {sub.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between gap-2 text-sm"><span className="break-words">{label}</span><span className="text-gold">{value}/10</span></div>
              <div className="h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${value * 10}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      {r.tldr && (
        <blockquote className="mt-8 rounded-r-xl border-l-4 border-violet bg-surface p-5">
          <p className="mb-1 text-sm text-muted">En bref</p>
          <p className="break-words text-lg leading-snug">{r.tldr}</p>
        </blockquote>
      )}

      <div className="mt-8">
        {r.spoilers ? (
          <details className="rounded-xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-medium text-gold">Cet avis contient des spoilers, cliquer pour l'afficher</summary>
            <div className="mt-4">{article}</div>
          </details>
        ) : article}
      </div>

      {(r.pros.length > 0 || r.cons.length > 0) && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {r.pros.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="font-display mb-3 text-lg font-bold">Points forts</h2>
              <ul className="space-y-2">
                {r.pros.map((p) => <li key={p} className="flex gap-2 break-words"><span className="font-bold text-[#6fd3b0]">+</span>{p}</li>)}
              </ul>
            </section>
          )}
          {r.cons.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="font-display mb-3 text-lg font-bold">Points faibles</h2>
              <ul className="space-y-2">
                {r.cons.map((p) => <li key={p} className="flex gap-2 break-words"><span className="font-bold text-[#ff8a7a]">−</span>{p}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Autres avis sur {r.game.title}</h2>

        {myId && !hasMine && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet/50 bg-surface p-5">
            <p>{m.asked} Donne ton avis.</p>
            <Link href={`/reviews/new?gameId=${r.gameId}`} className="rounded-lg bg-violet px-4 py-2 font-medium">Donner mon avis</Link>
          </div>
        )}
        {!myId && <p className="mt-4 text-sm text-muted">Connecte-toi avec Discord pour donner ton avis.</p>}

        {others.length === 0 ? (
          <p className="mt-4 text-muted">Aucun autre avis pour l'instant.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {others.map((o) => (
              <Link key={o.id} href={`/reviews/${o.id}`} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
                {o.user.image && <img src={o.user.image} alt="" className="h-10 w-10 shrink-0 rounded-full" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{o.user.name}</span>
                    <span className="font-display text-xl font-bold text-gold">{o.rating}<span className="text-xs text-muted">/10</span></span>
                  </div>
                  <p className="mt-1 line-clamp-3 break-words text-sm text-muted">
                    {o.spoilers ? "Cet avis contient des spoilers." : o.tldr ?? o.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
