"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  trackFunnel,
  trackMeta,
  trackMetaCustom,
  sendMetaCapi,
  hasMarketingConsent,
  getUtmParams,
} from "@/lib/analytics";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

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
    // Tracking interne — toujours, indépendamment du consentement
    trackFunnel("registration_success");

    // Meta Pixel + CAPI uniquement si consentement marketing accordé
    if (hasMarketingConsent()) {
      // event_id partagé Pixel/CAPI pour déduplication Meta
      const eventId = crypto.randomUUID();
      const utms = getUtmParams();

      // Pixel navigateur avec event_id
      trackMeta(
        "Lead",
        { content_name: "Inscription Kyrivo", value: 0, currency: "EUR" },
        eventId
      );

      // Log de diagnostic — event_id uniquement, aucune donnée sensible
      console.log("[meta-capi] calling /api/meta/lead", eventId);

      // CAPI serveur avec même event_id — best-effort, ne bloque pas l'inscription
      void sendMetaCapi({
        event_id:     eventId,
        email,
        source_url:   typeof window !== "undefined" ? window.location.href : undefined,
        utm_source:   utms.utm_source,
        utm_campaign: utms.utm_campaign,
        utm_content:  utms.utm_content,
      });
    }

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white flex items-center justify-center px-6 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl bg-glow-brand" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <img
            src="/brand/kyrivo-logo-primary-dark.svg"
            alt="Kyrivo"
            className="h-11"
          />
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
                  <h1 className="text-xl font-bold text-white">Compte créé avec succès</h1>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Votre espace Kyrivo est prêt. Si une confirmation par email est requise, vérifiez votre boîte de réception avant de vous connecter.
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Pensez à vérifier vos spams si vous ne recevez rien sous quelques minutes.
                  </p>
                </div>

                <Button href="/login" className="mt-2 w-full">
                  Se connecter
                </Button>
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

                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Créer un compte
                  </h1>

                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Lancez votre espace Kyrivo avec un essai Pro de 7 jours
                    et 125 lignes incluses pendant votre essai.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <Field
                    label="Nom de société ou pseudo"
                    type="text"
                    placeholder="Ex : Ma société"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />

                  <Field
                    label="Adresse email"
                    type="email"
                    placeholder="vous@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Field
                    label="Mot de passe"
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={
                      confirmPassword && confirmPassword !== password
                        ? "border-red-500/50"
                        : confirmPassword && confirmPassword === password
                        ? "border-emerald-500/40"
                        : ""
                    }
                    error={
                      confirmPassword && confirmPassword !== password
                        ? "Les mots de passe ne correspondent pas."
                        : undefined
                    }
                  />

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Création..." : "Créer mon compte"}
                  </Button>
                </form>

                <div className="mt-6 border-t border-neutral-800 pt-6 text-center">
                  <p className="text-sm text-neutral-500">Déjà un compte ?</p>
                  <Button href="/login" variant="secondary" className="mt-3 w-full">
                    Se connecter
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
