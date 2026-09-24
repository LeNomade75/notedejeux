# Critiques du serveur

A community review website for video games, movies, series and anime, built for a Discord server. Members sign in with Discord, search for a title (IGDB, TMDB or AniList) or add their own, write a rated review, and the review is announced automatically in a Discord channel as a rich embed.

Only members of a specific Discord server can sign in and post. Everyone else gets a polite refusal page with an invite link.

## Features

### Discord authentication and access control
- Sign in with Discord (OAuth2 via NextAuth).
- **Server membership check** at sign-in: the app reads the user's server list (`guilds` scope) and only lets in members of the server set in `DISCORD_GUILD_ID`.
- Non-members are redirected to a refusal page with a link to join the server.
- Stores each user's Discord ID, display name and avatar.

### Finding and adding titles
- Five media types: **games** ([IGDB](https://www.igdb.com/), via Twitch), **movies** and **series** ([TMDB](https://www.themoviedb.org/)), **anime** ([AniList](https://anilist.co/)) and **YouTube videos**. A type selector in the review form and a filter on the home page.
- Search results are shown as cards with cover, release year and platforms.
- **YouTube videos** are a media type of their own: paste a video link and the title, channel and thumbnail are fetched through YouTube's oEmbed endpoint (no API key needed). Watch, youtu.be, shorts and live links are accepted, and the video page is linked from the review.
- **Custom titles**: if a game is not on IGDB, add it with a title, cover image URL, genre and short description.
- The search also returns custom games that already exist, so the same game is not created twice. The server also reuses an existing custom game when the title matches (case-insensitive).

### Writing a review
- Overall rating from 1 to 10.
- Optional **sub-ratings**: graphics, gameplay, story, soundtrack. The labels adapt to the media type (for example direction, acting, screenplay and soundtrack for movies and series).
- Up to 6 **custom sub-ratings** with a name of your choice (for example "Difficulty" or "Replayability").
- Play status: completed, in progress, dropped, 100% / platinum.
- Hours played.
- Short summary (TL;DR), Markdown article, list of pros and cons.
- **Spoiler flag**: spoiler reviews are hidden behind a click and blurred out of previews and Discord embeds.
- One review per member per game.

### Discord announcement
When a review is published, a Discord webhook posts an embed containing:
- the title "Nouvel avis publié pour [game] !", the author's name and avatar;
- the rating as stars and as a score out of 10;
- the game cover as thumbnail;
- the TL;DR or the beginning of the article (wrapped in a spoiler tag when needed);
- pros and cons when provided;
- a link to read the full review on the website.

### Website
- **Home page**: latest reviews from the community, filter by title, author, minimum rating or media type, and a top 5 of the best rated games. Games are ranked by average rating, and ties are broken by number of reviews (which is displayed next to the score).
- **Review page**: cover header, community score (average of all reviews of the game), sub-rating bars, TL;DR, article, pros and cons, and the other reviews of the same game.
- **"Give my review" button** on every review page, opening the form with the game already selected.
- **Profile page** for every member: overall statistics, **statistics per media type** (games, movies, series, anime: reviews, finished, average rating, hours), a filter on their reviews, and "Mon profil" in the header to open yours.
- **Profile links**: members can showcase their accounts (YouTube channel, Steam, MyAnimeList, AniList, Kitsu, Letterboxd, Trakt, TMDB, IMDb, Backloggd, HowLongToBeat, PSNProfiles, Twitch) by pasting a simple link. The domain (and, where possible, the profile path) is checked against the chosen platform before saving.
- **Edit and delete**: the author of a review, and only the author, can edit or delete it from the review page. Editing does not post a new Discord message.
- **Rich text editor** ([TipTap](https://tiptap.dev/)) for the article: bold, italic, headings, lists and quotes. The content is stored as Markdown.
- Dark, gamer-style interface, responsive.

## Tech stack
- [Next.js 15](https://nextjs.org/) (App Router), React 19, TypeScript
- Tailwind CSS 4
- TipTap rich text editor (content stored as Markdown)
- PostgreSQL with [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/) v4 (Discord provider)
- [Zod](https://zod.dev/) for request validation, `react-markdown` for rendering
- IGDB API (via Twitch), Discord webhooks

## Getting started

### Prerequisites
- Node.js 20 or later
- A PostgreSQL database (local, Docker, Neon, Supabase…)
- A Discord server you manage
- A Twitch account (for IGDB access)

### 1. Install
```bash
git clone https://github.com/<your-username>/critiques-jeux.git
cd critiques-jeux
npm install
```

### 2. Configure the environment
Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Public URL of the site, e.g. `http://localhost:3000` (must match the port you use) |
| `NEXTAUTH_SECRET` | Random secret, generate with `openssl rand -base64 32` |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | From your application on the [Discord Developer Portal](https://discord.com/developers/applications) (OAuth2 tab) |
| `DISCORD_GUILD_ID` | ID of the server whose members are allowed (enable Developer Mode, right-click the server, Copy Server ID) |
| `DISCORD_INVITE_URL` | Invite link shown on the refusal page |
| `DISCORD_WEBHOOK_URL` | Webhook of the channel where reviews are announced (Edit Channel, Integrations, Webhooks) |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | From an application registered on the [Twitch Developer Console](https://dev.twitch.tv/console) (games) |
| `TMDB_API_KEY` | API key from a free [TMDB](https://www.themoviedb.org/settings/api) account (movies and series) |

In the Discord Developer Portal, add this redirect under OAuth2, Redirects:
`http://localhost:3000/api/auth/callback/discord` (and the same path on your production domain).

### 3. Create the database tables and run
```bash
npm run db:push
npm run dev
```
The site is then available at `NEXTAUTH_URL`.

## Project structure
```
prisma/schema.prisma          Data model (User, Game, Review)
src/lib/auth.ts               NextAuth config and Discord server check
src/lib/igdb.ts               IGDB search (Twitch token cached)
src/lib/tmdb.ts               TMDB search (movies and series)
src/lib/anilist.ts            AniList search (anime)
src/lib/media.ts              Media types, labels and sub-rating names
src/lib/links.ts              Allowed platforms and link validation
src/lib/youtube.ts            YouTube link parsing and video info (oEmbed)
src/lib/discord.ts            Discord embed sent on publication
src/lib/db.ts                 Prisma client
src/app/page.tsx              Home: feed, filters, top games
src/app/reviews/new           Review form
src/app/reviews/[id]          Review page with community score and other reviews
src/app/reviews/[id]/edit     Edit form (author only)
src/app/users/[id]            Member profile with statistics and reviews
src/app/profile               Redirects to the signed-in member's profile
src/app/refus                 Page shown to people outside the server
src/app/api/auth              NextAuth route
src/app/api/games/search      Search IGDB and existing custom games
src/app/api/games/[id]        Game lookup (used to pre-fill the form)
src/app/api/reviews           Review creation and Discord announcement
src/app/api/reviews/[id]      Review edit and delete (author only)
src/app/api/profile/links      Save profile links (signed-in member)
src/components/AuthButtons    Sign in / sign out buttons
src/components/ReviewForm     Review form (create and edit)
src/components/RichEditor     TipTap editor
src/components/LinksEditor     Profile links editor
src/components/ReviewActions  Edit / delete buttons
```

## Good to know
- The server membership check happens when signing in. Sessions last 7 days, so someone who leaves the server can keep posting until their session expires.
- Cover images for custom games are URLs only (no upload yet).

## Roadmap
- Dedicated page for each game
- Cover image upload
- Sub-ratings in the Discord embed
- Steam as an additional game source

## Acknowledgements
Game data from IGDB, anime data from AniList. This product uses the TMDB API but is not endorsed or certified by TMDB.

## License
Add the license of your choice (for example MIT) before making the repository public.
