"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackFunnel, trackMeta, trackMetaCustom } from "@/lib/analytics";

export default function RegisterPage() {
  const supabase = createClient();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    trackFunnel("register_view");
    trackMetaCustom("ViewRegister");
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName.trim(),
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered"))
        setError("Un compte existe déjà avec cette adresse email.");
      else if (msg.includes("password"))
        setError("Le mot de passe ne respecte pas les critères requis (minimum 6 caractères).");
      else if (msg.includes("invalid email"))
        setError("L'adresse email n'est pas valide.");
      else
        setError("Une erreur est survenue lors de la création du compte. Réessayez.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    // Tracking interne (toujours, sans Meta)
    trackFunnel("registration_success");
    // Meta Pixel uniquement si consentement marketing accordé
    trackMeta("Lead", { content_name: "Inscription Kyrivo", value: 0, currency: "EUR" });

    setLoading(false);
  }

  const inputClasses = `
    w-full rounded-xl border border-neutral-800
    bg-neutral-950 px-4 py-3
    text-sm text-white
    placeholder:text-neutral-700
    outline-none transition
    focus:border-amber-500/50
    focus:ring-2 focus:ring-amber-500/10
  `;

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white flex items-center justify-center px-6 py-10">
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
            {success ? (
              /* ── Écran de succès ── */
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Compte créé avec succès</h2>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Votre espace Kyrivo est prêt. Si une confirmation par email est requise, vérifiez votre boîte de réception avant de vous connecter.
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Pensez à vérifier vos spams si vous ne recevez rien sous quelques minutes.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="
                    mt-2 w-full inline-flex items-center justify-center
                    rounded-xl bg-amber-500 px-4 py-3
                    text-sm font-bold text-neutral-950
                    transition hover:bg-amber-400
                    shadow-lg shadow-amber-500/10
                  "
                >
                  Se connecter
                </Link>
              </div>
            ) : (
              /* ── Formulaire ── */
              <>
                <div className="mb-7">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                      Essai gratuit 7 jours
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-white">
                    Créer un compte
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Lancez votre espace Kyrivo avec un essai Pro de 7 jours
                    et 125 lignes incluses pendant votre essai.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Nom de société ou pseudo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Ma société"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      placeholder="vous@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      placeholder="Répétez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClasses} ${
                        confirmPassword && confirmPassword !== password
                          ? "border-red-500/50"
                          : confirmPassword && confirmPassword === password
                          ? "border-emerald-500/40"
                          : ""
                      }`}
                      required
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p className="mt-1.5 text-xs text-red-400">
                        Les mots de passe ne correspondent pas.
                      </p>
                    )}
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
                    {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </form>

                <div className="mt-6 border-t border-neutral-800 pt-6 text-center">
                  <p className="text-sm text-neutral-500">Déjà un compte ?</p>
                  <Link
                    href="/login"
                    className="
                      mt-3 inline-flex w-full items-center justify-center
                      rounded-xl border border-neutral-800
                      bg-neutral-950 px-4 py-3
                      text-sm font-semibold text-neutral-300
                      transition
                      hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400
                    "
                  >
                    Se connecter
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
