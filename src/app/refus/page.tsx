export default function Refus() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Ce site est réservé aux membres du serveur</h1>
      <p className="mt-4 text-muted">Ton compte Discord n'est pas dans le serveur. Rejoins-le, puis reviens te connecter.</p>
      <a href={process.env.DISCORD_INVITE_URL} className="mt-8 inline-block rounded-lg bg-violet px-5 py-2.5 font-medium">Rejoindre le Discord</a>
    </div>
  );
}
