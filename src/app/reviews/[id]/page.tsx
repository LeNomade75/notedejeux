import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { prisma } from "@/lib/db";

const STATUS: Record<string, string> = {
  COMPLETED: "Terminé", IN_PROGRESS: "En cours", DROPPED: "Abandonné", PLATINUM: "100 % / Platine",
};
const SUB = [["graphics", "Graphismes"], ["gameplay", "Gameplay"], ["story", "Histoire"], ["soundtrack", "Bande-son"]] as const;
const chip = "rounded-full border border-line bg-night/60 px-3 py-1 text-xs text-muted";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.review.findUnique({ where: { id }, include: { game: true, user: true } });
  if (!r) notFound();

  const custom = (r.customRatings as { label: string; value: number }[] | null) ?? [];
  const sub: [string, number][] = [
    ...SUB.filter(([k]) => r[k] != null).map(([k, label]) => [label, r[k] as number] as [string, number]),
    ...custom.map((c) => [c.label, c.value] as [string, number]),
  ];
  const meta = [r.game.genre, r.game.releaseDate?.getFullYear(), r.game.platforms.slice(0, 4).join(", ")].filter(Boolean).join(" · ");
  const article = <div className="review-body"><Markdown>{r.body}</Markdown></div>;

  return (
    <article className="mx-auto max-w-3xl">
      <header className="relative overflow-hidden rounded-2xl border border-line">
        {r.game.coverUrl && (
          <div aria-hidden className="absolute inset-0 scale-125 bg-cover bg-center opacity-25 blur-2xl" style={{ backgroundImage: `url(${r.game.coverUrl})` }} />
        )}
        <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-end">
          {r.game.coverUrl && <img src={r.game.coverUrl} alt="" className="w-36 shrink-0 rounded-xl shadow-2xl" />}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-display break-words text-3xl font-bold sm:text-4xl">{r.game.title}</h1>
            {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm sm:justify-start">
              {r.user.image && <img src={r.user.image} alt="" className="h-7 w-7 rounded-full" />}
              <span className="font-medium">{r.user.name}</span>
              <span className="text-muted">le {r.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className={chip}>{STATUS[r.status]}</span>
              {r.hoursPlayed ? <span className={chip}>{r.hoursPlayed} h de jeu</span> : null}
              {r.spoilers && <span className={`${chip} text-gold`}>Spoilers</span>}
            </div>
          </div>
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-2 border-gold bg-night/60">
            <span className="font-display text-4xl font-bold leading-none text-gold">{r.rating}</span>
            <span className="text-xs text-muted">sur 10</span>
          </div>
        </div>
      </header>

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
    </article>
  );
}