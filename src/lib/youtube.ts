const ID = /^[A-Za-z0-9_-]{11}$/;

// Extrait l'identifiant d'une vidéo YouTube (watch, youtu.be, shorts, live, embed)
export function parseYoutubeId(raw: string): string | null {
  const text = raw.trim();
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const [, kind, v] = u.pathname.split("/");
      if (["shorts", "live", "embed", "v"].includes(kind)) id = v ?? null;
    }
  }
  return id && ID.test(id) ? id : null;
}

export const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// Titre et chaîne via l'endpoint oEmbed de YouTube (aucune clé d'API nécessaire).
// Renvoie null si la vidéo est introuvable, privée ou non intégrable.
export async function fetchYoutubeMeta(id: string) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl(id))}&format=json`, { cache: "no-store" });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d?.title) return null;
    return {
      title: String(d.title).slice(0, 200),
      channel: d.author_name ? String(d.author_name).slice(0, 100) : undefined,
      coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}
