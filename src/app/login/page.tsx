"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/40"
            style={{
              background:
                "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
              boxShadow:
                "0 8px 28px -8px rgba(245,158,11,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <span className="text-lg font-black tracking-tighter text-neutral-950">
              K
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Kyrivo
              </h1>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              by <span className="font-semibold text-neutral-400">Kartium TCG</span>
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="p-8">
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                  Connexion sécurisée
                </span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white">
                Se connecter
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                Accédez à votre espace Kyrivo pour gérer vos achats, ventes,
                stocks et factures.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Adresse email
                </label>
                <input
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full rounded-xl border border-neutral-800
                    bg-neutral-950 px-4 py-3
                    text-sm text-white
                    placeholder:text-neutral-700
                    outline-none transition
                    focus:border-amber-500/50
                    focus:ring-2 focus:ring-amber-500/10
                  "
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full rounded-xl border border-neutral-800
                    bg-neutral-950 px-4 py-3
                    text-sm text-white
                    placeholder:text-neutral-700
                    outline-none transition
                    focus:border-amber-500/50
                    focus:ring-2 focus:ring-amber-500/10
                  "
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-xl bg-amber-500 px-4 py-3
                  text-sm font-bold text-neutral-950
                  transition hover:bg-amber-400
                  disabled:cursor-not-allowed disabled:opacity-50
                  shadow-lg shadow-amber-500/10
                "
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-6 border-t border-neutral-800 pt-6 text-center">
              <p className="text-sm text-neutral-500">
                Pas encore de compte ?
              </p>

              <Link
                href="/register"
                className="
                  mt-3 inline-flex w-full items-center justify-center
                  rounded-xl border border-neutral-800
                  bg-neutral-950 px-4 py-3
                  text-sm font-semibold text-neutral-300
                  transition
                  hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400
                "
              >
                Créer un compte Kyrivo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}