"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    setBusy(true);
    const r = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (r.ok) { router.push("/"); router.refresh(); }
    else { setBusy(false); alert("Suppression impossible."); }
  }

  return (
    <div className="mt-4 flex gap-3 text-sm">
      <Link href={`/reviews/${id}/edit`} className="rounded-lg border border-line bg-surface px-3 py-1.5">Modifier mon avis</Link>
      <button type="button" onClick={remove} disabled={busy} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[#ff8a7a] disabled:opacity-50">
        Supprimer
      </button>
    </div>
  );
}
