"use client";
import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl: "/" })}
      className="rounded-lg bg-violet px-3 py-1.5 font-medium"
    >
      Se connecter avec Discord
    </button>
  );
}

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="text-muted">
      Se déconnecter
    </button>
  );
}