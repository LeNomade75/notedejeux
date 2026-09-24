export type Platform = { id: string; label: string; domains: string[]; path?: RegExp; example: string };

// Chaque plateforme n'accepte que ses domaines et, quand c'est possible, une adresse de profil
export const PLATFORMS: Platform[] = [
  { id: "steam", label: "Steam", domains: ["steamcommunity.com"], path: /^\/(id|profiles)\/[^/]+/, example: "steamcommunity.com/id/pseudo" },
  { id: "backloggd", label: "Backloggd", domains: ["backloggd.com"], path: /^\/u\/[^/]+/, example: "backloggd.com/u/pseudo" },
  { id: "hltb", label: "HowLongToBeat", domains: ["howlongtobeat.com"], path: /^\/user\/[^/]+/, example: "howlongtobeat.com/user/pseudo" },
  { id: "psn", label: "PSNProfiles", domains: ["psnprofiles.com"], path: /^\/[^/]+\/?$/, example: "psnprofiles.com/pseudo" },
  { id: "mal", label: "MyAnimeList", domains: ["myanimelist.net"], path: /^\/(profile|animelist)\/[^/]+/, example: "myanimelist.net/profile/pseudo" },
  { id: "anilist", label: "AniList", domains: ["anilist.co"], path: /^\/user\/[^/]+/, example: "anilist.co/user/pseudo" },
  { id: "kitsu", label: "Kitsu", domains: ["kitsu.app", "kitsu.io"], path: /^\/users\/[^/]+/, example: "kitsu.app/users/pseudo" },
  { id: "letterboxd", label: "Letterboxd", domains: ["letterboxd.com"], path: /^\/[^/]+\/?$/, example: "letterboxd.com/pseudo" },
  { id: "trakt", label: "Trakt", domains: ["trakt.tv"], path: /^\/users\/[^/]+/, example: "trakt.tv/users/pseudo" },
  { id: "tmdb", label: "TMDB", domains: ["themoviedb.org"], path: /^\/u\/[^/]+/, example: "themoviedb.org/u/pseudo" },
  { id: "imdb", label: "IMDb", domains: ["imdb.com"], path: /^\/user\/[^/]+/, example: "imdb.com/user/ur1234567" },
  { id: "twitch", label: "Twitch", domains: ["twitch.tv"], path: /^\/[^/]+\/?$/, example: "twitch.tv/pseudo" },
];

export function validateLink(platformId: string, raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const p = PLATFORMS.find((x) => x.id === platformId);
  if (!p) return { ok: false, error: "Plateforme inconnue." };
  const text = raw.trim();
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, error: `${p.label} : ce lien n'est pas valide.` };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, error: `${p.label} : lien non autorisé.` };
  if (u.username || u.password) return { ok: false, error: `${p.label} : lien non autorisé.` };
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!p.domains.includes(host)) return { ok: false, error: `${p.label} : le lien doit venir de ${p.domains[0]}.` };
  if (p.path && !p.path.test(u.pathname)) return { ok: false, error: `${p.label} : le lien doit mener à ton profil (ex : ${p.example}).` };
  // On enregistre une version nettoyée : https, sans paramètres ni ancre
  return { ok: true, url: `https://${host}${u.pathname.replace(/\/+$/, "") || "/"}` };
}
