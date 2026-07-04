"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Erreur updateUser (reset password):", error);
      setError("Impossible de modifier le mot de passe. Le lien a peut-être expiré.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl bg-glow-brand" />
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
            <p className="text-2xl font-bold tracking-tight text-white">Kyrivo</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="p-8">
            {done ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Mot de passe mis à jour</h1>
                  <p className="mt-2 text-sm text-neutral-400">
                    Votre mot de passe a bien été modifié. Vous pouvez maintenant vous connecter.
                  </p>
                </div>
                <Button href="/login" variant="secondary" size="sm" className="mt-2">
                  Se connecter
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Nouveau mot de passe
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Choisissez un nouveau mot de passe pour votre compte Kyrivo.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field
                    label="Nouveau mot de passe"
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <Field
                    label="Confirmer le mot de passe"
                    type="password"
                    placeholder="Répétez votre mot de passe"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
