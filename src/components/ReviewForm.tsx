"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import { MEDIA, MEDIA_TYPES, statusOptions, type MediaType } from "@/lib/media";

type G = { id?: string; custom?: boolean; mediaType?: MediaType; igdbId?: number; tmdbId?: number; anilistId?: number; youtubeId?: string; channel?: string; title: string; coverUrl?: string; releaseDate?: string; platforms?: string[]; genre?: string; summary?: string };
type Custom = { label: string; value: number };
export type Initial = { rating: number; status: string; hours: string; tldr: string; body: string; pros: string; cons: string; spoilers: boolean; std: Record<string, string>; cr: Custom[] };

const input = "w-full rounded-lg border border-line bg-surface px-3 py-2";
const small = "rounded-lg border border-line bg-surface px-2 py-1";
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const EMPTY = { rating: 8, status: "COMPLETED", hours: "", tldr: "", body: "", pros: "", cons: "", spoilers: false };

export default function ReviewForm({ reviewId, initial, gameTitle, mediaType }: { reviewId?: string; initial?: Initial; gameTitle?: string; mediaType?: MediaType }) {
  const router = useRouter();
  const editing = !!reviewId;
  const [type, setType] = useState<MediaType>("GAME");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<G[]>([]);
  const [game, setGame] = useState<G | null>(null);
  const [custom, setCustom] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState(initial ? { rating: initial.rating, status: initial.status, hours: initial.hours, tldr: initial.tldr, body: initial.body, pros: initial.pros, cons: initial.cons, spoilers: initial.spoilers } : EMPTY);
  const [std, setStd] = useState<Record<string, string>>(initial?.std ?? {});
  const [cr, setCr] = useState<Custom[]>(initial?.cr ?? []);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const upd = (i: number, patch: Partial<Custom>) => setCr(cr.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  // Type effectif : celui du titre choisi (ou de l'avis modifié), sinon l'onglet sélectionné
  const kind: MediaType = mediaType ?? game?.mediaType ?? type;
  const m = MEDIA[kind];

  useEffect(() => {
    if (editing) return;
    const id = new URLSearchParams(window.location.search).get("gameId");
    if (!id) return;
    fetch(`/api/games/${id}`).then((r) => (r.ok ? r.json() : null)).then((g) => g && setGame({ ...g, id }));
  }, [editing]);

  async function search() {
    setErr("");
    const r = await fetch(`/api/games/search?q=${encodeURIComponent(q)}&type=${type}`);
    const d = await r.json().catch(() => null);
    if (!r.ok) { setErr(d?.error ?? "Recherche impossible"); setResults([]); return; }
    setResults(d);
    if (d.length === 0) setErr("Aucun résultat pour cette recherche.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !game?.title) return setErr("Choisis ou crée un titre d'abord.");
    // En modification, une sous-note vidée est envoyée à null pour être effacée
    const stdValues = Object.fromEntries(m.subs.filter(([k]) => editing || std[k]).map(([k]) => [k, std[k] ? Number(std[k]) : null]));
    const res = await fetch(editing ? `/api/reviews/${reviewId}` : "/api/reviews", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editing ? {} : { game }),
        rating: f.rating, status: f.status, body: f.body,
        tldr: f.tldr || (editing ? null : undefined),
        hoursPlayed: f.hours ? Number(f.hours) : editing ? null : undefined,
        pros: lines(f.pros), cons: lines(f.cons), spoilers: f.spoilers,
        ...stdValues,
        customRatings: cr.filter((c) => c.label.trim()).map((c) => ({ label: c.label.trim(), value: c.value })),
      }),
    });
    const d = await res.json();
    if (res.ok) { router.push(`/reviews/${d.id}`); router.refresh(); } else setErr(d.error ?? "Erreur");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold">{editing ? "Modifier mon avis" : "Écrire un avis"}</h1>
      {editing && <p className="text-sm text-muted">{m.label} : <b className="text-ink">{gameTitle}</b></p>}

      {!editing && !game && !custom && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {MEDIA_TYPES.map((t) => (
              <button
                type="button" key={t}
                onClick={() => { setType(t); setResults([]); setErr(""); }}
                className={`rounded-full border px-4 py-1.5 text-sm ${type === t ? "border-violet bg-violet text-white" : "border-line text-muted"}`}
              >
                {MEDIA[t].plural}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={input} value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={type === "VIDEO" ? "Colle le lien de la vidéo YouTube" : `Chercher ${MEDIA[type].a} (${MEDIA[type].source})`}
            />
            <button type="button" onClick={search} className="rounded-lg bg-violet px-4">{type === "VIDEO" ? "Récupérer" : "Chercher"}</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {results.map((g) => (
              <button type="button" key={`${g.id ?? ""}${g.igdbId ?? g.tmdbId ?? g.anilistId ?? g.youtubeId ?? ""}`} onClick={() => setGame(g)} className="rounded-xl border border-line bg-surface p-2 text-left">
                {g.coverUrl && <img src={g.coverUrl} alt="" className={`mb-2 w-full rounded-md object-cover ${g.youtubeId ? "aspect-video" : "aspect-[3/4]"}`} />}
                <div className="text-sm font-medium">{g.title}</div>
                <div className="text-xs text-muted">
                  {g.custom ? "Sur mesure" : g.channel ?? `${g.releaseDate?.slice(0, 4) ?? ""} ${g.platforms?.slice(0, 3).join(", ") ?? ""}`}
                </div>
              </button>
            ))}
          </div>
          {type !== "VIDEO" && (
            <button type="button" onClick={() => { setCustom(true); setGame({ title: "", mediaType: type }); }} className="text-sm text-gold underline">
              Introuvable ? Ajouter {MEDIA[type].a} sur mesure
            </button>
          )}
        </section>
      )}

      {!editing && custom && game && (
        <section className="space-y-3">
          <input className={input} placeholder="Titre" value={game.title} onChange={(e) => setGame({ ...game, title: e.target.value })} />
          <input className={input} placeholder="URL de l'affiche / couverture (https://…)" value={game.coverUrl ?? ""} onChange={(e) => setGame({ ...game, coverUrl: e.target.value })} />
          <input className={input} placeholder="Genre" value={game.genre ?? ""} onChange={(e) => setGame({ ...game, genre: e.target.value })} />
          <textarea className={input} placeholder="Description rapide" value={game.summary ?? ""} onChange={(e) => setGame({ ...game, summary: e.target.value })} />
        </section>
      )}
      {!editing && game && !custom && (
        <p className="text-sm">{m.label} sélectionné : <b>{game.title}</b> <button type="button" className="text-gold underline" onClick={() => setGame(null)}>changer</button></p>
      )}

      <label className="block">Note : <b className="text-gold">{f.rating}/10</b>
        <input type="range" min={1} max={10} value={f.rating} onChange={(e) => set("rating", Number(e.target.value))} className="w-full accent-violet" />
      </label>

      <fieldset className="space-y-3 rounded-xl border border-line p-4">
        <legend className="px-2 text-sm text-muted">Sous-notes (facultatif)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {m.subs.map(([k, label]) => (
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
            <input className={input} placeholder="Nom du critère (ex : Rythme)" maxLength={30} value={c.label} onChange={(e) => upd(i, { label: e.target.value })} />
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
          {statusOptions(kind).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input className={input} type="number" min={0} placeholder={m.hours} value={f.hours} onChange={(e) => set("hours", e.target.value)} />
      </div>
      <input className={input} placeholder="Résumé rapide (TL;DR)" maxLength={400} value={f.tldr} onChange={(e) => set("tldr", e.target.value)} />

      <div>
        <RichEditor value={f.body} onChange={(v) => set("body", v)} />
        <p className="mt-1 text-xs text-muted">Ton avis (50 caractères minimum).</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea className={input} placeholder="Points forts (un par ligne)" value={f.pros} onChange={(e) => set("pros", e.target.value)} />
        <textarea className={input} placeholder="Points faibles (un par ligne)" value={f.cons} onChange={(e) => set("cons", e.target.value)} />
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.spoilers} onChange={(e) => set("spoilers", e.target.checked)} /> Cet avis contient des spoilers</label>
      {err && <p className="text-red-400">{err}</p>}
      <button className="rounded-lg bg-violet px-5 py-2.5 font-medium">{editing ? "Enregistrer les modifications" : "Publier l'avis"}</button>
    </form>
  );
}
