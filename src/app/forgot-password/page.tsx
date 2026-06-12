"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Erreur resetPasswordForEmail:", error);
      setError(
        "Impossible d'envoyer le lien de réinitialisation pour le moment. Réessayez dans quelques instants."
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,1) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/40"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
              boxShadow: "0 8px 28px -8px rgba(245,158,11,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <span className="text-lg font-black tracking-tighter text-neutral-950">K</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Kyrivo</h1>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="p-8">
            {sent ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Email envoyé</h2>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                    Si un compte existe pour <span className="text-neutral-200 font-medium">{email}</span>, vous recevrez un lien de réinitialisation dans quelques minutes.
                  </p>
                  <p className="mt-3 text-xs text-neutral-600">
                    Pensez à vérifier vos spams.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-amber-500/30 hover:text-amber-400"
                >
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Mot de passe oublié
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Renseignez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    {loading ? "Envoi en cours..." : "Envoyer le lien"}
                  </button>
                </form>

                <div className="mt-6 border-t border-neutral-800 pt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-amber-400 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
