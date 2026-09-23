"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type G = { igdbId?: number; title: string; coverUrl?: string; releaseDate?: string; platforms?: string[]; genre?: string; summary?: string };
type Custom = { label: string; value: number };
const input = "w-full rounded-lg border border-line bg-surface px-3 py-2";
const small = "rounded-lg border border-line bg-surface px-2 py-1";
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const STD = [["graphics", "Graphismes"], ["gameplay", "Gameplay"], ["story", "Histoire"], ["soundtrack", "Bande-son"]] as const;
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function NewReview() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<G[]>([]);
  const [game, setGame] = useState<G | null>(null);
  const [custom, setCustom] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ rating: 8, status: "COMPLETED", hours: "", tldr: "", body: "", pros: "", cons: "", spoilers: false });
  const [std, setStd] = useState<Record<string, string>>({});
  const [cr, setCr] = useState<Custom[]>([]);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const upd = (i: number, patch: Partial<Custom>) => setCr(cr.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function search() {
    setErr("");
    const r = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
    const d = await r.json().catch(() => null);
    if (!r.ok) { setErr(d?.error ?? "Recherche impossible"); setResults([]); return; }
    setResults(d);
    if (d.length === 0) setErr("Aucun résultat pour cette recherche.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!game?.title) return setErr("Choisis ou crée un jeu d'abord.");
    const res = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game, rating: f.rating, status: f.status, tldr: f.tldr || undefined, body: f.body,
        hoursPlayed: f.hours ? Number(f.hours) : undefined, pros: lines(f.pros), cons: lines(f.cons), spoilers: f.spoilers,
        ...Object.fromEntries(STD.filter(([k]) => std[k]).map(([k]) => [k, Number(std[k])])),
        customRatings: cr.filter((c) => c.label.trim()).map((c) => ({ label: c.label.trim(), value: c.value })),
      }),
    });
    const d = await res.json();
    if (res.ok) router.push(`/reviews/${d.id}`); else setErr(d.error ?? "Erreur");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Écrire un avis</h1>

      {!game && !custom && (
        <section className="space-y-3">
          <div className="flex gap-2">
            <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un jeu (IGDB)" />
            <button type="button" onClick={search} className="rounded-lg bg-violet px-4">Chercher</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {results.map((g) => (
              <button type="button" key={g.igdbId} onClick={() => setGame(g)} className="rounded-xl border border-line bg-surface p-2 text-left">
                {g.coverUrl && <img src={g.coverUrl} alt="" className="mb-2 aspect-[3/4] w-full rounded-md object-cover" />}
                <div className="text-sm font-medium">{g.title}</div>
                <div className="text-xs text-muted">{g.releaseDate?.slice(0, 4)} {g.platforms?.slice(0, 3).join(", ")}</div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setCustom(true); setGame({ title: "" }); }} className="text-sm text-gold underline">Jeu introuvable ? Ajouter un jeu sur mesure</button>
        </section>
      )}

      {custom && game && (
        <section className="space-y-3">
          <input className={input} placeholder="Titre" value={game.title} onChange={(e) => setGame({ ...game, title: e.target.value })} />
          <input className={input} placeholder="URL de la couverture (https://…)" value={game.coverUrl ?? ""} onChange={(e) => setGame({ ...game, coverUrl: e.target.value })} />
          <input className={input} placeholder="Genre" value={game.genre ?? ""} onChange={(e) => setGame({ ...game, genre: e.target.value })} />
          <textarea className={input} placeholder="Description rapide" value={game.summary ?? ""} onChange={(e) => setGame({ ...game, summary: e.target.value })} />
        </section>
      )}
      {game && !custom && (
        <p className="text-sm">Jeu choisi : <b>{game.title}</b> <button type="button" className="text-gold underline" onClick={() => setGame(null)}>changer</button></p>
      )}

      <label className="block">Note : <b className="text-gold">{f.rating}/10</b>
        <input type="range" min={1} max={10} value={f.rating} onChange={(e) => set("rating", Number(e.target.value))} className="w-full accent-violet" />
      </label>

      <fieldset className="space-y-3 rounded-xl border border-line p-4">
        <legend className="px-2 text-sm text-muted">Sous-notes (facultatif)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {STD.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm">
              {label}
              <select className={small} value={std[k] ?? ""} onChange={(e) => setStd({ ...std, [k]: e.target.value })}>
                <option value="">—</option>
                {SCORES.map((n) => <option key={n} value={n}>{n}/10</option>)}
              </select>
            </label>
          ))}
        </div>
        {cr.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={input} placeholder="Nom du critère (ex : Difficulté)" maxLength={30} value={c.label} onChange={(e) => upd(i, { label: e.target.value })} />
            <select className={small} value={c.value} onChange={(e) => upd(i, { value: Number(e.target.value) })}>
              {SCORES.map((n) => <option key={n} value={n}>{n}/10</option>)}
            </select>
            <button type="button" aria-label="Retirer ce critère" onClick={() => setCr(cr.filter((_, j) => j !== i))} className="px-2 text-muted">✕</button>
          </div>
        ))}
        {cr.length < 6 && (
          <button type="button" onClick={() => setCr([...cr, { label: "", value: 7 }])} className="text-sm text-gold underline">+ Ajouter un critère personnalisé</button>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}>
          <option value="COMPLETED">Terminé</option><option value="IN_PROGRESS">En cours</option>
          <option value="DROPPED">Abandonné</option><option value="PLATINUM">100% / Platine</option>
        </select>
        <input className={input} type="number" min={0} placeholder="Heures de jeu" value={f.hours} onChange={(e) => set("hours", e.target.value)} />
      </div>
      <input className={input} placeholder="Résumé rapide (TL;DR)" maxLength={400} value={f.tldr} onChange={(e) => set("tldr", e.target.value)} />
      <textarea className={`${input} min-h-48`} placeholder="Ton avis (Markdown accepté, 50 caractères minimum)" value={f.body} onChange={(e) => set("body", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <textarea className={input} placeholder="Points forts (un par ligne)" value={f.pros} onChange={(e) => set("pros", e.target.value)} />
        <textarea className={input} placeholder="Points faibles (un par ligne)" value={f.cons} onChange={(e) => set("cons", e.target.value)} />
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.spoilers} onChange={(e) => set("spoilers", e.target.checked)} /> Cet avis contient des spoilers</label>
      {err && <p className="text-red-400">{err}</p>}
      <button className="rounded-lg bg-violet px-5 py-2.5 font-medium">Publier l'avis</button>
    </form>
  );
}