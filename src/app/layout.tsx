import "./globals.css";
import Link from "next/link";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--f-body" });
export const metadata = { title: "Critiques du serveur", description: "Les avis jeux vidéo de la communauté" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="fr" className={`dark ${display.variable} ${body.variable}`}>
      <body>
        <header className="border-b border-line">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-display text-xl font-bold">Critiques du serveur</Link>
            <div className="flex items-center gap-4 text-sm">
              {session ? (
  <>
    <Link href="/reviews/new" className="rounded-lg bg-violet px-3 py-1.5 font-medium">Écrire un avis</Link>
    <SignOutButton />
  </>
) : (
  <SignInButton />
)}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
