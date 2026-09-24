"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORMS } from "@/lib/links";

type Row = { platform: string; url: string };

export default function LinksEditor({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const free = PLATFORMS.filter((p) => !rows.some((r) => r.platform === p.id));

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/profile/links", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: rows }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: "Liens enregistrés." }); router.refresh(); }
    else setMsg({ ok: false, text: d.error ?? "Erreur" });
  }

  return (
    <details className="mt-4 rounded-xl border border-line bg-surface p-4">
      <summary className="cursor-pointer text-sm font-medium">Modifier mes liens</summary>
      <div className="mt-4 space-y-3">
        <p className="text-xs text-muted">Colle l'adresse de ton profil. Le domaine est vérifié : chaque lien doit venir de la bonne plateforme.</p>
        {rows.map((r, i) => {
          const p = PLATFORMS.find((x) => x.id === r.platform);
          if (!p) return null;
          return (
            <div key={r.platform} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-sm">{p.label}</span>
              <input
                className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm"
                placeholder={p.example} value={r.url} maxLength={300}
                onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              />
              <button type="button" aria-label={`Retirer ${p.label}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="px-2 text-muted">✕</button>
            </div>
          );
        })}
        {free.length > 0 && (
          <select
            value="" onChange={(e) => e.target.value && setRows([...rows, { platform: e.target.value, url: "" }])}
            className="rounded-lg border border-line bg-night px-2 py-2 text-sm"
          >
            <option value="">+ Ajouter une plateforme…</option>
            {free.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-violet px-4 py-2 text-sm font-medium disabled:opacity-50">Enregistrer</button>
          {msg && <span className={`text-sm ${msg.ok ? "text-[#6fd3b0]" : "text-red-400"}`}>{msg.text}</span>}
        </div>
      </div>
    </details>
  );
}
