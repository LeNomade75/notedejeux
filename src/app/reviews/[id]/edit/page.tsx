import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReviewForm from "@/components/ReviewForm";

export default async function EditReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const myId = (session?.user as { discordId?: string } | undefined)?.discordId;
  const r = await prisma.review.findUnique({ where: { id }, include: { game: true, user: true } });
  if (!r) notFound();
  if (!myId || r.user.discordId !== myId) redirect(`/reviews/${id}`);

  const std = Object.fromEntries(
    (["graphics", "gameplay", "story", "soundtrack"] as const).filter((k) => r[k] != null).map((k) => [k, String(r[k])])
  );
  return (
    <ReviewForm
      reviewId={r.id}
      gameTitle={r.game.title}
      mediaType={r.game.mediaType}
      initial={{
        rating: r.rating, status: r.status, hours: r.hoursPlayed?.toString() ?? "", tldr: r.tldr ?? "", body: r.body,
        pros: r.pros.join("\n"), cons: r.cons.join("\n"), spoilers: r.spoilers, std,
        cr: (r.customRatings as { label: string; value: number }[] | null) ?? [],
      }}
    />
  );
}
